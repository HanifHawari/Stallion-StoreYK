import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Langganan email belum tersedia." }, { status: 503 });
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    const raw = await request.text();
    if (raw.length > 1024) return NextResponse.json({ error: "Data terlalu besar." }, { status: 400 });
    let body: unknown;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ error: "Email tidak valid." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body) || !("email" in body) || typeof body.email !== "string") {
      return NextResponse.json({ error: "Email tidak valid." }, { status: 400 });
    }
    const email = body.email.trim().toLowerCase();
    if (email !== customer.email.toLowerCase()) return NextResponse.json({ error: "Gunakan email akun Anda." }, { status: 403 });
    await getPool().query(
      "INSERT INTO newsletter_subscribers (email, customer_id) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING",
      [email, customer.id],
    );
    return NextResponse.json({ message: "Email berhasil didaftarkan untuk kabar Stallion Store." });
  } catch {
    return NextResponse.json({ error: "Langganan belum dapat disimpan. Coba lagi nanti." }, { status: 503 });
  }
}
