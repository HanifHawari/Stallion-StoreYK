import { NextResponse } from "next/server";
import { createCustomerSession, hashPassword, verifyPassword, type CurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { clearAttempts, ipKey, isAnyRateLimited, RATE_LIMIT_MESSAGE, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

// Hash pembanding untuk email yang tidak terdaftar, agar waktu respons sama dan tidak membocorkan email mana yang ada.
let dummyHash: Promise<string> | undefined;

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Sistem ini masih dalam tahap pengembangan." }, { status: 503 });
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Data terlalu besar." }, { status: 400 });
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
    const { email, password } = input as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128) return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 400 });
    const cleanEmail = email.trim().toLowerCase();
    // Batas gagal login: 5×/15 menit per email+IP, dan 20×/jam per email dari IP mana pun.
    // Tanpa IP yang diketahui, kunci pasangan memakai email saja (tetap 5×/15 menit per akun).
    const pairKey = ipKey(`login:${cleanEmail}`, request) ?? `login:${cleanEmail}`;
    const emailKey = `login-email:${cleanEmail}`;
    if (await isAnyRateLimited([[pairKey, 5, 900], [emailKey, 20, 3600]])) return NextResponse.json({ error: RATE_LIMIT_MESSAGE }, { status: 429 });
    const result = await getPool().query<CurrentCustomer & { password_hash: string }>(
      "SELECT id, name, email, password_hash FROM customers WHERE email = $1", [cleanEmail],
    );
    const customer = result.rows[0];
    const valid = customer ? await verifyPassword(password, customer.password_hash) : (await verifyPassword(password, await (dummyHash ??= hashPassword("stallion-dummy-password"))), false);
    if (!customer || !valid) {
      await recordAttempt(pairKey, emailKey);
      return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    }
    await clearAttempts(pairKey);
    await createCustomerSession(customer.id);
    return NextResponse.json({ user: { id: customer.id, name: customer.name, email: customer.email } });
  } catch {
    return NextResponse.json({ error: "Login belum tersedia. Coba lagi nanti." }, { status: 503 });
  }
}

