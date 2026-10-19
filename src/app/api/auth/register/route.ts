import { NextResponse } from "next/server";
import { createCustomerSession, hashPassword, newCustomerId } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { ipKey, isAnyRateLimited, RATE_LIMIT_MESSAGE, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Pendaftaran belum dikonfigurasi. Hubungi pengelola toko." }, { status: 503 });
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Data terlalu besar." }, { status: 400 });
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: "Data pendaftaran tidak valid." }, { status: 400 });
    const { name, email, password } = input as Record<string, unknown>;
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") return NextResponse.json({ error: "Lengkapi semua kolom." }, { status: 400 });
    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();
    if (cleanName.length < 2 || cleanName.length > 100 || cleanEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail) || password.length < 8 || password.length > 128) return NextResponse.json({ error: "Isi nama, email, dan kata sandi minimal 8 karakter." }, { status: 400 });
    const limitKey = ipKey("register", request);
    if (await isAnyRateLimited([[limitKey, 3, 3600]])) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    await recordAttempt(limitKey);
    const id = newCustomerId();
    await getPool().query("INSERT INTO customers (id, name, email, password_hash) VALUES ($1, $2, $3, $4)", [id, cleanName, cleanEmail, await hashPassword(password)]);
    await createCustomerSession(id);
    return NextResponse.json({ user: { id, name: cleanName, email: cleanEmail } }, { status: 201 });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
    return NextResponse.json({ error: "Pendaftaran belum tersedia. Coba lagi nanti." }, { status: 503 });
  }
}

