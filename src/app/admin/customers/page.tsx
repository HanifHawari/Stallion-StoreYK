import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, pageParam, Pagination } from "@/components/admin/admin-ui";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pelanggan" };
const PAGE_SIZE = 30;

export default async function AdminCustomers({ searchParams }: { searchParams: Promise<{ q?: string; page?: string }> }) {
  await requireAdminPage("/admin/customers");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const values: unknown[] = [];
  let whereSql = "";
  if (q) { values.push(`%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`); whereSql = "WHERE c.name ILIKE $1 OR c.email ILIKE $1"; }
  const pool = getPool();
  const total = (await pool.query<{ count: number }>(`SELECT COUNT(*)::integer AS count FROM customers c ${whereSql}`, values)).rows[0].count;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageParam(params.page), totalPages);
  const rows = (await pool.query<{ id: string; name: string; email: string; role: string; created_at: Date; orders: number; spent: string }>(`
    SELECT c.id, c.name, c.email, c.role, c.created_at, COUNT(o.id)::integer AS orders, COALESCE(SUM(o.total_idr) FILTER (WHERE o.status = 'paid'), 0)::text AS spent
    FROM customers c LEFT JOIN orders o ON o.customer_id = c.id ${whereSql}
    GROUP BY c.id ORDER BY c.created_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `, values)).rows;
  return <>
    <AdminHeader title="Pelanggan" description={`${total} akun terdaftar.`} />
    <form className="admin-filters" action="/admin/customers">
      <input name="q" defaultValue={q} placeholder="Cari nama atau email…" aria-label="Cari pelanggan" />
      <button className="button button-dark" type="submit">CARI</button>
      {q && <Link href="/admin/customers">Reset</Link>}
    </form>
    <section className="admin-card">
      {rows.length ? <table className="admin-table"><thead><tr><th>Nama</th><th>Email</th><th>Terdaftar</th><th>Pesanan</th><th>Belanja (lunas)</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}>
          <td><Link href={`/admin/customers/${row.id}`}>{row.name}</Link>{row.role === "admin" && <small><span className="admin-badge is-info">Admin</span></small>}</td>
          <td>{row.email}</td><td>{adminDate.format(row.created_at)}</td><td>{row.orders}</td><td>{formatRupiah(Number(row.spent))}</td>
        </tr>)}
      </tbody></table> : <p className="admin-empty">Tidak ada pelanggan yang cocok.</p>}
      <Pagination page={page} totalPages={totalPages} href={(target) => "/admin/customers?" + new URLSearchParams({ ...(q && { q }), page: String(target) }).toString()} />
    </section>
  </>;
}
