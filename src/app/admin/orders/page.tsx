import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, FulfillmentBadge, OrderStatusBadge, pageParam, Pagination } from "@/components/admin/admin-ui";
import { requireAdminPage, TO_PROCESS_SQL } from "@/lib/admin";
import { adminDate, FULFILLMENT_LABEL, ORDER_STATUS_LABEL } from "@/lib/admin-labels";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pesanan" };
const PAGE_SIZE = 30;

type Row = { id: string; customer_name: string; customer_email: string; total_idr: number; status: string; fulfillment_status: string | null; tracking_number: string | null; created_at: Date };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; fulfillment?: string; page?: string }> }) {
  await requireAdminPage("/admin/orders");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const status = params.status && Object.hasOwn(ORDER_STATUS_LABEL, params.status) ? params.status : "";
  const fulfillment = params.fulfillment === "open" || (params.fulfillment && Object.hasOwn(FULFILLMENT_LABEL, params.fulfillment)) ? params.fulfillment : "";
  const where: string[] = [];
  const values: unknown[] = [];
  if (q) { values.push(`%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`); where.push(`(id ILIKE $${values.length} OR customer_name ILIKE $${values.length} OR customer_email ILIKE $${values.length} OR tracking_number ILIKE $${values.length})`); }
  if (status) { values.push(status); where.push(`status = $${values.length}`); }
  if (fulfillment === "open") where.push(`(${TO_PROCESS_SQL})`);
  else if (fulfillment === "processing") where.push("status = 'paid' AND (fulfillment_status IS NULL OR fulfillment_status = 'processing')");
  else if (fulfillment) { values.push(fulfillment); where.push(`fulfillment_status = $${values.length}`); }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const pool = getPool();
  const total = (await pool.query<{ count: number }>(`SELECT COUNT(*)::integer AS count FROM orders ${whereSql}`, values)).rows[0].count;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageParam(params.page), totalPages);
  const rows = (await pool.query<Row>(`
    SELECT id, customer_name, customer_email, total_idr, status, fulfillment_status, tracking_number, created_at FROM orders ${whereSql}
    ORDER BY created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `, values)).rows;
  const query = (next: Record<string, string | number>) => "/admin/orders?" + new URLSearchParams({ ...(q && { q }), ...(status && { status }), ...(fulfillment && { fulfillment }), ...Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])) }).toString();

  return <>
    <AdminHeader title="Pesanan" description={`${total} pesanan sesuai filter.`} />
    <form className="admin-filters" action="/admin/orders">
      <input name="q" defaultValue={q} placeholder="Cari nomor pesanan, nama, email, atau resi…" aria-label="Cari pesanan" />
      <select name="status" defaultValue={status} aria-label="Status pembayaran"><option value="">Semua pembayaran</option>{Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <select name="fulfillment" defaultValue={fulfillment} aria-label="Status proses"><option value="">Semua proses</option><option value="open">Perlu diproses / dikirim</option>{Object.entries(FULFILLMENT_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      <button className="button button-dark" type="submit">FILTER</button>
      {(q || status || fulfillment) && <Link href="/admin/orders">Reset</Link>}
    </form>
    <section className="admin-card">
      {rows.length ? <table className="admin-table"><thead><tr><th>Pesanan</th><th>Pelanggan</th><th>Total</th><th>Pembayaran</th><th>Proses</th><th>Resi</th></tr></thead><tbody>
        {rows.map((order) => <tr key={order.id}>
          <td><Link href={`/admin/orders/${order.id}`}>{order.id}</Link><small>{adminDate.format(order.created_at)}</small></td>
          <td>{order.customer_name}<small>{order.customer_email}</small></td>
          <td>{formatRupiah(order.total_idr)}</td>
          <td><OrderStatusBadge status={order.status} /></td>
          <td><FulfillmentBadge status={order.fulfillment_status} paid={order.status === "paid"} /></td>
          <td>{order.tracking_number ?? <span className="admin-muted">—</span>}</td>
        </tr>)}
      </tbody></table> : <p className="admin-empty">Tidak ada pesanan yang cocok.</p>}
      <Pagination page={page} totalPages={totalPages} href={(target) => query({ page: target })} />
    </section>
  </>;
}
