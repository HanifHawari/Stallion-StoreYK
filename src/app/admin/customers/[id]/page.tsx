import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader, FulfillmentBadge, OrderStatusBadge, Stat } from "@/components/admin/admin-ui";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detail Pelanggan" };

export default async function AdminCustomer({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/customers/${id}`);
  const pool = getPool();
  const customer = (await pool.query<{ id: string; name: string; email: string; role: string; created_at: Date; subscribed: boolean; addresses: number; wishlist: number }>(`
    SELECT c.id, c.name, c.email, c.role, c.created_at,
      EXISTS (SELECT 1 FROM newsletter_subscribers n WHERE n.customer_id = c.id) AS subscribed,
      (SELECT COUNT(*)::integer FROM customer_addresses a WHERE a.customer_id = c.id) AS addresses,
      (SELECT COUNT(*)::integer FROM wishlists w WHERE w.customer_id = c.id) AS wishlist
    FROM customers c WHERE c.id = $1
  `, [id])).rows[0];
  if (!customer) notFound();
  const orders = (await pool.query<{ id: string; total_idr: number; status: string; fulfillment_status: string | null; created_at: Date }>(
    "SELECT id, total_idr, status, fulfillment_status, created_at FROM orders WHERE customer_id = $1 ORDER BY created_at DESC LIMIT 100", [id],
  )).rows;
  const spent = orders.filter((order) => order.status === "paid").reduce((sum, order) => sum + order.total_idr, 0);
  return <>
    <AdminHeader title={customer.name} description={<>{customer.email} · terdaftar {adminDate.format(customer.created_at)}{customer.role === "admin" && " · Admin"}</>} back={{ href: "/admin/customers", label: "Pelanggan" }} />
    <div className="admin-stats">
      <Stat label="Pesanan" value={orders.length} />
      <Stat label="Belanja lunas" value={formatRupiah(spent)} />
      <Stat label="Alamat tersimpan" value={customer.addresses} />
      <Stat label="Wishlist" value={customer.wishlist} />
      <Stat label="Newsletter" value={customer.subscribed ? "Ya" : "Tidak"} />
    </div>
    <section className="admin-card">
      <div className="admin-card-heading"><h2>Riwayat pesanan</h2></div>
      {orders.length ? <table className="admin-table"><thead><tr><th>Pesanan</th><th>Tanggal</th><th>Total</th><th>Pembayaran</th><th>Proses</th></tr></thead><tbody>
        {orders.map((order) => <tr key={order.id}>
          <td><Link href={`/admin/orders/${order.id}`}>{order.id}</Link></td><td>{adminDate.format(order.created_at)}</td><td>{formatRupiah(order.total_idr)}</td>
          <td><OrderStatusBadge status={order.status} /></td><td><FulfillmentBadge status={order.fulfillment_status} paid={order.status === "paid"} /></td>
        </tr>)}
      </tbody></table> : <p className="admin-empty">Belum ada pesanan.</p>}
    </section>
  </>;
}
