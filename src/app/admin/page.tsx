import Link from "next/link";
import { AdminHeader, FulfillmentBadge, OrderStatusBadge, Stat } from "@/components/admin/admin-ui";
import { requireAdminPage, TO_PROCESS_SQL } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";

// Batas hari/bulan dihitung dalam WIB (Asia/Jakarta).
const TODAY = "date_trunc('day', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'";
const MONTH = "date_trunc('month', now() AT TIME ZONE 'Asia/Jakarta') AT TIME ZONE 'Asia/Jakarta'";

export default async function AdminDashboard() {
  await requireAdminPage("/admin");
  const pool = getPool();
  const [stats, lowStock, recent] = await Promise.all([
    pool.query<{ today: number; month: number; revenue: string; to_process: number; stock_issue: number; awaiting: number }>(`
      SELECT
        COUNT(*) FILTER (WHERE created_at >= ${TODAY})::integer AS today,
        COUNT(*) FILTER (WHERE created_at >= ${MONTH})::integer AS month,
        COALESCE(SUM(total_idr) FILTER (WHERE status = 'paid' AND paid_at >= ${MONTH}), 0)::text AS revenue,
        COUNT(*) FILTER (WHERE ${TO_PROCESS_SQL})::integer AS to_process,
        COUNT(*) FILTER (WHERE status = 'stock_issue')::integer AS stock_issue,
        COUNT(*) FILTER (WHERE status = 'awaiting_payment' AND expires_at > now())::integer AS awaiting
      FROM orders
    `),
    pool.query<{ product_id: string; name: string; size_eu: string; stock: number }>(`
      SELECT p.id AS product_id, p.name, v.size_eu, v.stock FROM product_variants v JOIN products p ON p.id = v.product_id
      WHERE p.active AND v.stock <= 2 ORDER BY v.stock, p.name, v.size_value LIMIT 12
    `),
    pool.query<{ id: string; customer_name: string; total_idr: number; status: string; fulfillment_status: string | null; created_at: Date }>(
      "SELECT id, customer_name, total_idr, status, fulfillment_status, created_at FROM orders ORDER BY created_at DESC LIMIT 8",
    ),
  ]);
  const s = stats.rows[0];
  return <>
    <AdminHeader title="Dashboard" description="Ringkasan toko hari ini. Waktu dalam WIB." />
    <div className="admin-stats">
      <Stat label="Pesanan hari ini" value={s.today} />
      <Stat label="Pesanan bulan ini" value={s.month} />
      <Stat label="Omzet lunas bulan ini" value={formatRupiah(Number(s.revenue))} />
      <Stat label="Perlu diproses" value={s.to_process} hint="Lunas, belum dikirim" href="/admin/orders?fulfillment=open" />
      <Stat label="Masalah stok" value={s.stock_issue} hint="Dibayar, stok kurang" href="/admin/orders?status=stock_issue" />
      <Stat label="Menunggu pembayaran" value={s.awaiting} href="/admin/orders?status=awaiting_payment" />
    </div>
    <div className="admin-grid">
      <section className="admin-card">
        <div className="admin-card-heading"><h2>Pesanan terbaru</h2><Link href="/admin/orders">Semua pesanan →</Link></div>
        {recent.rows.length ? <table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Bayar</th><th>Proses</th></tr></thead><tbody>
          {recent.rows.map((order) => <tr key={order.id}>
            <td><Link href={`/admin/orders/${order.id}`}>{order.id.slice(0, 11)}…</Link><small>{adminDate.format(order.created_at)}</small></td>
            <td>{order.customer_name}</td><td>{formatRupiah(order.total_idr)}</td>
            <td><OrderStatusBadge status={order.status} /></td><td><FulfillmentBadge status={order.fulfillment_status} paid={order.status === "paid"} /></td>
          </tr>)}
        </tbody></table> : <p className="admin-empty">Belum ada pesanan.</p>}
      </section>
      <section className="admin-card">
        <div className="admin-card-heading"><h2>Stok menipis (≤ 2)</h2><Link href="/admin/products?status=active">Produk →</Link></div>
        {lowStock.rows.length ? <table className="admin-table"><thead><tr><th>Produk</th><th>EU</th><th>Stok</th></tr></thead><tbody>
          {lowStock.rows.map((row) => <tr key={row.product_id + row.size_eu}><td><Link href={`/admin/products/${row.product_id}#stok`}>{row.name}</Link></td><td>{row.size_eu}</td><td className={row.stock === 0 ? "admin-danger" : undefined}>{row.stock}</td></tr>)}
        </tbody></table> : <p className="admin-empty">Semua ukuran produk aktif punya stok lebih dari 2.</p>}
      </section>
    </div>
  </>;
}
