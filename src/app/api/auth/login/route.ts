import { NextResponse } from "next/server";
import { createCustomerSession, verifyPassword, type CurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Sistem ini masih dalam tahap pengembangan." }, { status: 503 });
  try {
    const text = await request.text();
    if (text.length > 4096) return NextResponse.json({ error: "Data terlalu besar." }, { status: 400 });
    const input: unknown = JSON.parse(text);
    if (!input || typeof input !== "object" || Array.isArray(input)) return NextResponse.json({ error: "Data login tidak valid." }, { status: 400 });
    const { email, password } = input as Record<string, unknown>;
    if (typeof email !== "string" || typeof password !== "string" || email.length > 254 || password.length > 128) return NextResponse.json({ error: "Email atau kata sandi tidak valid." }, { status: 400 });
    const result = await getPool().query<CurrentCustomer & { password_hash: string }>(
      "SELECT id, name, email, password_hash FROM customers WHERE email = $1", [email.trim().toLowerCase()],
    );
    const customer = result.rows[0];
    if (!customer || !(await verifyPassword(password, customer.password_hash))) return NextResponse.json({ error: "Email atau kata sandi salah." }, { status: 401 });
    await createCustomerSession(customer.id);
    return NextResponse.json({ user: { id: customer.id, name: customer.name, email: customer.email } });
  } catch {
    return NextResponse.json({ error: "Login belum tersedia. Coba lagi nanti." }, { status: 503 });
  }
}

