import type { Metadata } from "next";
import Link from "next/link";
import { AdminHeader, pageParam, Pagination } from "@/components/admin/admin-ui";
import { requireAdminPage } from "@/lib/admin";
import { formatRupiah } from "@/lib/catalog";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Produk" };
const PAGE_SIZE = 30;

type Row = { id: string; slug: string; name: string; brand: string; category: string; image_url: string; price_idr: number | null; active: boolean; total_stock: number; sizes_in_stock: number; weight_grams: number | null };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string; status?: string; brand?: string; page?: string }> }) {
  await requireAdminPage("/admin/products");
  const params = await searchParams;
  const q = (params.q ?? "").trim().slice(0, 100);
  const status = params.status === "active" || params.status === "draft" ? params.status : "all";
  const brand = (params.brand ?? "").trim().slice(0, 60);
  const where: string[] = [];
  const values: unknown[] = [];
  if (q) { values.push(`%${q.replace(/[\\%_]/g, (c) => "\\" + c)}%`); where.push(`(p.name ILIKE $${values.length} OR p.slug ILIKE $${values.length} OR p.color ILIKE $${values.length})`); }
  if (status !== "all") where.push(status === "active" ? "p.active" : "NOT p.active");
  if (brand) { values.push(brand); where.push(`p.brand = $${values.length}`); }
  const whereSql = where.length ? "WHERE " + where.join(" AND ") : "";
  const pool = getPool();
  const [count, brands] = await Promise.all([
    pool.query<{ count: number }>(`SELECT COUNT(*)::integer AS count FROM products p ${whereSql}`, values),
    pool.query<{ brand: string }>("SELECT DISTINCT brand FROM products ORDER BY brand"),
  ]);
  const totalPages = Math.max(1, Math.ceil(count.rows[0].count / PAGE_SIZE));
  const page = Math.min(pageParam(params.page), totalPages);
  const rows = (await pool.query<Row>(`
    SELECT p.id, p.slug, p.name, p.brand, p.category, p.image_url, p.price_idr, p.active, p.weight_grams,
      COALESCE(SUM(v.stock), 0)::integer AS total_stock, COUNT(v.id) FILTER (WHERE v.stock > 0)::integer AS sizes_in_stock
    FROM products p LEFT JOIN product_variants v ON v.product_id = p.id
    ${whereSql} GROUP BY p.id ORDER BY p.active DESC, p.created_at DESC
    LIMIT ${PAGE_SIZE} OFFSET ${(page - 1) * PAGE_SIZE}
  `, values)).rows;
  const query = (next: Record<string, string | number>) => "/admin/products?" + new URLSearchParams({ ...(q && { q }), ...(status !== "all" && { status }), ...(brand && { brand }), ...Object.fromEntries(Object.entries(next).map(([k, v]) => [k, String(v)])) }).toString();

  return <>
    <AdminHeader title="Produk & Stok" description={`${count.rows[0].count} produk. Produk draft (tanpa harga atau dinonaktifkan) tidak tampil di toko.`} actions={<Link className="button button-dark" href="/admin/products/new"><span className="material-symbols-outlined">add</span> TAMBAH PRODUK</Link>} />
    <form className="admin-filters" action="/admin/products">
      <input name="q" defaultValue={q} placeholder="Cari nama, slug, atau warna…" aria-label="Cari produk" />
      <select name="status" defaultValue={status} aria-label="Status"><option value="all">Semua status</option><option value="active">Aktif</option><option value="draft">Draft</option></select>
      <select name="brand" defaultValue={brand} aria-label="Brand"><option value="">Semua brand</option>{brands.rows.map((row) => <option key={row.brand} value={row.brand}>{row.brand}</option>)}</select>
      <button className="button button-dark" type="submit">FILTER</button>
      {(q || status !== "all" || brand) && <Link href="/admin/products">Reset</Link>}
    </form>
    <section className="admin-card">
      {rows.length ? <table className="admin-table admin-table-products"><thead><tr><th>Produk</th><th>Brand / kategori</th><th>Harga</th><th>Stok</th><th>Status</th><th /></tr></thead><tbody>
        {rows.map((row) => <tr key={row.id}>
          <td><div className="admin-product-cell"><img src={row.image_url} alt="" /><span><Link href={`/admin/products/${row.id}`}>{row.name}</Link><small>/{row.slug}</small></span></div></td>
          <td>{row.brand}<small>{row.category}</small></td>
          <td>{row.price_idr === null ? <span className="admin-muted">Belum ada</span> : formatRupiah(row.price_idr)}</td>
          <td className={row.total_stock === 0 ? "admin-danger" : undefined}>{row.total_stock}<small>{row.sizes_in_stock} ukuran tersedia</small>{!row.weight_grams && <small className="admin-warning-text">Berat paket kosong</small>}</td>
          <td><span className={`admin-badge ${row.active ? "is-ok" : "is-muted"}`}>{row.active ? "Aktif" : "Draft"}</span></td>
          <td><Link className="admin-link-button" href={`/admin/products/${row.id}`}>Ubah</Link></td>
        </tr>)}
      </tbody></table> : <p className="admin-empty">Tidak ada produk yang cocok.</p>}
      <Pagination page={page} totalPages={totalPages} href={(target) => query({ page: target })} />
    </section>
  </>;
}
