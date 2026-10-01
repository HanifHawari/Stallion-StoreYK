import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import type { OrderStatus } from "@/lib/commerce";

export const runtime = "nodejs";

type OrderRow = { id: string; status: OrderStatus; total_idr: number; created_at: Date };

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Cek pesanan belum tersedia." }, { status: 503 });
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    const raw = await request.text();
    if (raw.length > 1024) return NextResponse.json({ error: "Data terlalu besar." }, { status: 400 });
    let body: unknown;
    try { body = JSON.parse(raw); }
    catch { return NextResponse.json({ error: "Detail pesanan tidak valid." }, { status: 400 }); }
    if (!body || typeof body !== "object" || Array.isArray(body) || !("orderId" in body) || !("email" in body) || typeof body.orderId !== "string" || typeof body.email !== "string") {
      return NextResponse.json({ error: "Detail pesanan tidak valid." }, { status: 400 });
    }
    const orderId = body.orderId.trim();
    const email = body.email.trim().toLowerCase();
    if (!/^ST-[a-f0-9-]{36}$/.test(orderId) || email.length > 254 || email !== customer.email.toLowerCase()) {
      return NextResponse.json({ error: "Pesanan tidak ditemukan untuk akun ini." }, { status: 404 });
    }
    const result = await getPool().query<OrderRow>(
      "SELECT id, status, total_idr, created_at FROM orders WHERE id = $1 AND customer_id = $2 AND lower(customer_email) = $3",
      [orderId, customer.id, email],
    );
    const order = result.rows[0];
    if (!order) return NextResponse.json({ error: "Pesanan tidak ditemukan untuk akun ini." }, { status: 404 });
    return NextResponse.json({ order: { id: order.id, status: order.status, totalIdr: order.total_idr, createdAt: order.created_at.toISOString() } });
  } catch {
    return NextResponse.json({ error: "Status pesanan belum dapat diperiksa. Coba lagi nanti." }, { status: 503 });
  }
}

