import type { Metadata } from "next";
import { AdminHeader, pageParam, Pagination } from "@/components/admin/admin-ui";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Newsletter" };
const PAGE_SIZE = 50;

export default async function AdminNewsletter({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  await requireAdminPage("/admin/newsletter");
  const pool = getPool();
  const total = (await pool.query<{ count: number }>("SELECT COUNT(*)::integer AS count FROM newsletter_subscribers")).rows[0].count;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageParam((await searchParams).page), totalPages);
  const rows = (await pool.query<{ email: string; name: string | null; subscribed_at: Date }>(`
    SELECT n.email, c.name, n.subscribed_at FROM newsletter_subscribers n LEFT JOIN customers c ON c.id = n.customer_id
    ORDER BY n.subscribed_at DESC LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `)).rows;
  return <>
    <AdminHeader title="Newsletter" description={`${total} pelanggan berlangganan kabar Stallion Store.`}
      actions={/* Unduhan file: navigasi biasa, bukan navigasi client. */ <a className="button button-dark" href="/api/admin/newsletter" download><span className="material-symbols-outlined">download</span> UNDUH CSV</a>} />
    <section className="admin-card">
      {rows.length ? <table className="admin-table"><thead><tr><th>Email</th><th>Nama</th><th>Berlangganan sejak</th></tr></thead><tbody>
        {rows.map((row) => <tr key={row.email}><td>{row.email}</td><td>{row.name ?? "—"}</td><td>{adminDate.format(row.subscribed_at)}</td></tr>)}
      </tbody></table> : <p className="admin-empty">Belum ada pelanggan newsletter.</p>}
      <Pagination page={page} totalPages={totalPages} href={(target) => `/admin/newsletter?page=${target}`} />
    </section>
  </>;
}
