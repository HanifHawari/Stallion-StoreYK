import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { formatRupiah } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/commerce";
import { CancelOrderButton } from "@/components/cancel-order-button";
import { OrderDetails, type OrderDetail, type OrderDetailItem } from "@/components/order-details";

export const dynamic = "force-dynamic";
type OrderRow = OrderDetail & { id: string; payment_url: string | null };
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
  const result = await getPool().query<OrderRow>(`
    SELECT id, status, total_idr, subtotal_idr, shipping_idr, payment_url, created_at, paid_at, expires_at, customer_name, customer_phone,
      shipping_address, shipping_city, shipping_postal_code, shipping_courier_code, shipping_service_code,
      fulfillment_status, tracking_number, shipped_at, delivered_at
    FROM orders WHERE id = $1 AND customer_id = $2`, [id, customer.id]);
  const order = result.rows[0];
  if (!order) notFound();
  // Pesanan yang sudah dibayar lalu dibatalkan toko (mis. stok habis): dana dikembalikan, bukan "buat pesanan baru".
  const message = order.status === "cancelled" && order.paid_at ? { title: "PESANAN DIBATALKAN TOKO", detail: "Pesanan dibatalkan oleh Stallion Store setelah pembayaran diterima. Dana akan dikembalikan; tim kami akan menghubungimu.", icon: "cancel" } : messages[order.status];
  const items = (await getPool().query<OrderDetailItem>("SELECT product_name, size_eu, image_url, unit_price_idr, quantity FROM order_items WHERE order_id = $1 ORDER BY product_name, size_eu", [order.id])).rows;
  return <div className="order-page"><div className="site-container order-card"><span className="material-symbols-outlined order-icon">{message.icon}</span><span className="eyebrow">STALLION STORE / ORDER STATUS</span><h1>{message.title}</h1><p>{message.detail}</p><div className="order-facts"><span>ORDER ID <strong>{order.id}</strong></span><span>TOTAL <strong>{formatRupiah(order.total_idr)}</strong></span></div><OrderDetails order={order} items={items} /><div className="order-actions">{order.status === "awaiting_payment" && order.payment_url && <a href={order.payment_url} className="button button-orange" rel="noopener noreferrer">LANJUTKAN PEMBAYARAN <span className="material-symbols-outlined">arrow_forward</span></a>}{order.status === "awaiting_payment" && <CancelOrderButton orderId={order.id} />}<Link href="/shoes" className="button button-outline-dark">CONTINUE SHOPPING</Link><a href={`/order/${order.id}`} className="refresh-order">MUAT ULANG STATUS</a></div></div></div>;
}

