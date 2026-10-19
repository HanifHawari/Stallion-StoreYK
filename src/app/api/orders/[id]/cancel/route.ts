import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";

// Membatalkan pesanan milik sendiri yang belum dibayar, agar stok yang direservasi kembali tersedia.
// Tidak memanggil Midtrans: jika pembayaran tetap masuk, webhook akan menandai pesanan "paid".
export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: "Pembatalan pesanan belum tersedia." }, { status: 503 });
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return NextResponse.json({ error: "Silakan login terlebih dahulu." }, { status: 401 });
    const { id } = await params;
    if (!/^ST-[a-f0-9-]{36}$/.test(id)) return NextResponse.json({ error: "Pesanan tidak ditemukan." }, { status: 404 });
    const result = await getPool().query(
      "UPDATE orders SET status = 'cancelled' WHERE id = $1 AND customer_id = $2 AND status = 'awaiting_payment' RETURNING id",
      [id, customer.id],
    );
    if (!result.rowCount) return NextResponse.json({ error: "Pesanan ini tidak dapat dibatalkan." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Pesanan belum dapat dibatalkan. Coba lagi nanti." }, { status: 503 });
  }
}
