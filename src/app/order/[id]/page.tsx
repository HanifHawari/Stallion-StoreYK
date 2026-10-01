import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { formatRupiah } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/commerce";

export const dynamic = "force-dynamic";
type OrderRow = { id: string; status: OrderStatus; total_idr: number; payment_url: string | null; created_at: Date };
const messages: Record<OrderStatus, { title: string; detail: string; icon: string }> = {
  awaiting_payment: { title: "MENUNGGU PEMBAYARAN", detail: "Selesaikan pembayaran di Midtrans. Status akan berubah setelah pembayaran dikonfirmasi.", icon: "pending" },
  paid: { title: "PEMBAYARAN BERHASIL", detail: "Pembayaran sudah terkonfirmasi. Pesanan sedang disiapkan.", icon: "check_circle" },
  failed: { title: "PEMBAYARAN GAGAL", detail: "Transaksi ditolak. Silakan buat pesanan baru.", icon: "error" },
  expired: { title: "PEMBAYARAN KEDALUWARSA", detail: "Waktu pembayaran telah habis. Silakan buat pesanan baru.", icon: "schedule" },
  cancelled: { title: "PESANAN DIBATALKAN", detail: "Transaksi dibatalkan. Silakan buat pesanan baru.", icon: "cancel" },
  payment_setup_failed: { title: "PEMBAYARAN BELUM TERSEDIA", detail: "Halaman pembayaran gagal dibuat. Silakan kembali ke keranjang dan coba lagi.", icon: "error" },
  stock_issue: { title: "PESANAN PERLU DITINJAU", detail: "Pembayaran diterima, tetapi stok perlu ditinjau pengelola toko sebelum pesanan diproses.", icon: "inventory_2" },
};

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  if (!process.env.DATABASE_URL) notFound();
  const { id } = await params;
  if (!/^ST-[a-f0-9-]{36}$/.test(id)) notFound();
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=" + encodeURIComponent("/order/" + id));
  const result = await getPool().query<OrderRow>("SELECT id, status, total_idr, payment_url, created_at FROM orders WHERE id = $1 AND customer_id = $2", [id, customer.id]);
  const order = result.rows[0];
  if (!order) notFound();
  const message = messages[order.status];
  return <div className="order-page"><div className="site-container order-card"><span className="material-symbols-outlined order-icon">{message.icon}</span><span className="eyebrow">STALLION STORE / ORDER STATUS</span><h1>{message.title}</h1><p>{message.detail}</p><div className="order-facts"><span>ORDER ID <strong>{order.id}</strong></span><span>TOTAL <strong>{formatRupiah(order.total_idr)}</strong></span></div><div className="order-actions">{order.status === "awaiting_payment" && order.payment_url && <a href={order.payment_url} className="button button-orange" rel="noopener noreferrer">LANJUTKAN PEMBAYARAN <span className="material-symbols-outlined">arrow_forward</span></a>}<Link href="/shoes" className="button button-outline-dark">CONTINUE SHOPPING</Link><a href={`/order/${order.id}`} className="refresh-order">MUAT ULANG STATUS</a></div></div></div>;
}

