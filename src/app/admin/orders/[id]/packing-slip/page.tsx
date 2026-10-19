import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PrintButton } from "@/components/admin/print-button";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Packing Slip" };

export default async function PackingSlip({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/orders/${id}/packing-slip`);
  const pool = getPool();
  const order = (await pool.query<{ id: string; customer_name: string; customer_phone: string; shipping_address: string; shipping_city: string; shipping_postal_code: string; shipping_courier_code: string | null; shipping_service_code: string | null; tracking_number: string | null; created_at: Date }>(
    "SELECT id, customer_name, customer_phone, shipping_address, shipping_city, shipping_postal_code, shipping_courier_code, shipping_service_code, tracking_number, created_at FROM orders WHERE id = $1", [id],
  )).rows[0];
  if (!order) notFound();
  const items = (await pool.query<{ product_name: string; size_eu: string; quantity: number; sku: string | null }>(`
    SELECT oi.product_name, oi.size_eu, oi.quantity, v.sku FROM order_items oi LEFT JOIN product_variants v ON v.id = oi.variant_id WHERE oi.order_id = $1 ORDER BY oi.product_name, oi.size_eu
  `, [id])).rows;
  const courier = [order.shipping_courier_code, order.shipping_service_code].filter(Boolean).join(" · ").toUpperCase();
  return <article className="packing-slip">
    <div className="packing-slip-actions"><PrintButton /></div>
    <header><div><strong className="packing-slip-brand">STALLION<span>STORE</span></strong><p>Jl. Mangga Jl. Affandi No.109 B, Gejayan, Sleman, Yogyakarta 55583 · 0821 2099 9926</p></div><div><h1>PACKING SLIP</h1><p>{order.id}<br />{adminDate.format(order.created_at)}</p></div></header>
    <section className="packing-slip-address"><h2>KIRIM KE</h2><p><strong>{order.customer_name}</strong><br />{order.customer_phone}<br />{order.shipping_address}<br />{order.shipping_city} {order.shipping_postal_code}</p><p>Kurir: <strong>{courier || "—"}</strong>{order.tracking_number && <> · Resi: <strong>{order.tracking_number}</strong></>}</p></section>
    <table><thead><tr><th>Produk</th><th>SKU</th><th>EU</th><th>Qty</th><th>✓</th></tr></thead><tbody>
      {items.map((item, index) => <tr key={index}><td>{item.product_name}</td><td>{item.sku ?? "—"}</td><td>{item.size_eu}</td><td>{item.quantity}</td><td /></tr>)}
    </tbody></table>
    <p className="packing-slip-total">Total pasang: <strong>{items.reduce((sum, item) => sum + item.quantity, 0)}</strong></p>
  </article>;
}
