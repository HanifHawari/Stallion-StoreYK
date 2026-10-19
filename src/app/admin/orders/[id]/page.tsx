import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, FulfillmentBadge, OrderStatusBadge } from "@/components/admin/admin-ui";
import { OrderAdminPanel } from "@/components/admin/order-admin-panel";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail Pesanan" };

type OrderRow = {
  id: string; status: string; fulfillment_status: string | null; tracking_number: string | null; admin_note: string | null;
  customer_name: string; customer_email: string; customer_phone: string; shipping_address: string; shipping_city: string; shipping_postal_code: string;
  shipping_courier_code: string | null; shipping_service_code: string | null; subtotal_idr: number; shipping_idr: number; total_idr: number;
  created_at: Date; paid_at: Date | null; expires_at: Date; shipped_at: Date | null; delivered_at: Date | null;
  customer_id: string | null; account_name: string | null; account_email: string | null;
};

export default async function AdminOrderDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/orders/${id}`);
  const pool = getPool();
  const order = (await pool.query<OrderRow>(`
    SELECT o.*, c.name AS account_name, c.email AS account_email FROM orders o LEFT JOIN customers c ON c.id = o.customer_id WHERE o.id = $1
  `, [id])).rows[0];
  if (!order) notFound();
  const items = (await pool.query<{ product_name: string; size_eu: string; image_url: string; unit_price_idr: number; quantity: number; variant_id: string; product_id: string | null }>(`
    SELECT oi.product_name, oi.size_eu, oi.image_url, oi.unit_price_idr, oi.quantity, oi.variant_id, v.product_id
    FROM order_items oi LEFT JOIN product_variants v ON v.id = oi.variant_id WHERE oi.order_id = $1 ORDER BY oi.product_name, oi.size_eu
  `, [id])).rows;
  const courier = [order.shipping_courier_code, order.shipping_service_code].filter(Boolean).join(" · ").toUpperCase();
  const paid = order.status === "paid";
  return <>
    <AdminHeader title={order.id} description={<>Dibuat {adminDate.format(order.created_at)} · <OrderStatusBadge status={order.status} /> <FulfillmentBadge status={order.fulfillment_status} paid={paid} /></>} back={{ href: "/admin/orders", label: "Pesanan" }}
      actions={<Link className="button button-outline-dark" href={`/admin/orders/${order.id}/packing-slip`} target="_blank"><span className="material-symbols-outlined">print</span> PACKING SLIP</Link>} />
    <div className="admin-grid">
      <div>
        <OrderAdminPanel orderId={order.id} status={order.status} fulfillment={order.fulfillment_status} tracking={order.tracking_number} note={order.admin_note} />
        <section className="admin-card">
          <div className="admin-card-heading"><h2>Item</h2></div>
          <table className="admin-table"><thead><tr><th>Produk</th><th>EU</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>
            {items.map((item, index) => <tr key={index}>
              <td><div className="admin-product-cell"><img src={item.image_url} alt="" /><span>{item.product_id ? <Link href={`/admin/products/${item.product_id}`}>{item.product_name}</Link> : item.product_name}</span></div></td>
              <td>{item.size_eu}</td><td>{item.quantity}</td><td>{formatRupiah(item.unit_price_idr)}</td><td>{formatRupiah(item.unit_price_idr * item.quantity)}</td>
            </tr>)}
          </tbody></table>
          <dl className="admin-totals"><div><dt>Subtotal</dt><dd>{formatRupiah(order.subtotal_idr)}</dd></div><div><dt>Ongkir</dt><dd>{formatRupiah(order.shipping_idr)}</dd></div><div><dt>Total</dt><dd>{formatRupiah(order.total_idr)}</dd></div></dl>
        </section>
      </div>
      <div>
        <section className="admin-card">
          <div className="admin-card-heading"><h2>Pengiriman</h2></div>
          <p className="admin-address"><strong>{order.customer_name}</strong><br />{order.customer_phone}<br />{order.customer_email}<br />{order.shipping_address}<br />{order.shipping_city} {order.shipping_postal_code}</p>
          <dl className="admin-facts">
            <div><dt>Kurir</dt><dd>{courier || "—"}</dd></div>
            <div><dt>Resi</dt><dd>{order.tracking_number ?? "—"}</dd></div>
            <div><dt>Dikirim</dt><dd>{order.shipped_at ? adminDate.format(order.shipped_at) : "—"}</dd></div>
            <div><dt>Diterima</dt><dd>{order.delivered_at ? adminDate.format(order.delivered_at) : "—"}</dd></div>
          </dl>
        </section>
        <section className="admin-card">
          <div className="admin-card-heading"><h2>Pembayaran & akun</h2></div>
          <dl className="admin-facts">
            <div><dt>Status</dt><dd><OrderStatusBadge status={order.status} /></dd></div>
            <div><dt>Dibayar</dt><dd>{order.paid_at ? adminDate.format(order.paid_at) : "—"}</dd></div>
            <div><dt>Batas bayar</dt><dd>{adminDate.format(order.expires_at)}</dd></div>
            <div><dt>Akun</dt><dd>{order.customer_id ? <Link href={`/admin/customers/${order.customer_id}`}>{order.account_name}</Link> : "—"}{order.account_email && <small>{order.account_email}</small>}</dd></div>
          </dl>
          {order.admin_note && <p className="admin-note">{order.admin_note}</p>}
        </section>
      </div>
    </div>
  </>;
}
