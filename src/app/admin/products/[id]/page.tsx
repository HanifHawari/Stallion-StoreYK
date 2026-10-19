import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminHeader } from "@/components/admin/admin-ui";
import { ProductForm, type ProductFormValues } from "@/components/admin/product-form";
import { VariantManager } from "@/components/admin/variant-manager";
import { requireAdminPage } from "@/lib/admin";
import { adminDate } from "@/lib/admin-labels";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ubah Produk" };

type ProductRow = {
  id: string; slug: string; name: string; brand: string; category: string; color: string; description: string; price_idr: number | null; compare_at_idr: number | null;
  badge: string | null; active: boolean; image_url: string; hover_image_url: string | null; weight_grams: number | null; length_cm: string | null; width_cm: string | null; height_cm: string | null;
};

export default async function EditProduct({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  await requireAdminPage(`/admin/products/${id}`);
  const pool = getPool();
  const product = (await pool.query<ProductRow>("SELECT * FROM products WHERE id = $1", [id])).rows[0];
  if (!product) notFound();
  const [variants, movements, brands] = await Promise.all([
    pool.query<{ id: string; size_eu: string; sku: string; stock: number; ordered: boolean }>(`
      SELECT v.id, v.size_eu, v.sku, v.stock, EXISTS (SELECT 1 FROM order_items oi WHERE oi.variant_id = v.id) AS ordered
      FROM product_variants v WHERE v.product_id = $1 ORDER BY v.size_value
    `, [id]),
    pool.query<{ size_eu: string; delta: number; stock_after: number; reason: string; admin_name: string | null; order_id: string | null; created_at: Date }>(`
      SELECT v.size_eu, m.delta, m.stock_after, m.reason, c.name AS admin_name, m.order_id, m.created_at
      FROM stock_movements m JOIN product_variants v ON v.id = m.variant_id LEFT JOIN customers c ON c.id = m.admin_id
      WHERE v.product_id = $1 ORDER BY m.created_at DESC LIMIT 30
    `, [id]),
    pool.query<{ brand: string }>("SELECT DISTINCT brand FROM products ORDER BY brand"),
  ]);
  const initial: ProductFormValues = {
    name: product.name, slug: product.slug, brand: product.brand, category: product.category, color: product.color, description: product.description,
    priceIdr: product.price_idr?.toString() ?? "", compareAtIdr: product.compare_at_idr?.toString() ?? "", badge: product.badge ?? "", active: product.active,
    imageUrl: product.image_url, hoverImageUrl: product.hover_image_url ?? "",
    weightGrams: product.weight_grams?.toString() ?? "", lengthCm: product.length_cm ? String(Number(product.length_cm)) : "", widthCm: product.width_cm ? String(Number(product.width_cm)) : "", heightCm: product.height_cm ? String(Number(product.height_cm)) : "",
  };
  const created = (await searchParams).created === "1";
  return <>
    <AdminHeader title={product.name} description={<>ID {product.id} · {product.active ? "Aktif" : "Draft"}{created && " · Produk tersimpan. Tambahkan ukuran & stok di bawah."}</>} back={{ href: "/admin/products", label: "Produk" }}
      actions={product.active ? <Link className="button button-outline-dark" href={`/shoes/${product.slug}`} target="_blank">LIHAT DI TOKO</Link> : undefined} />
    <ProductForm productId={product.id} initial={initial} brands={brands.rows.map((row) => row.brand)} />
    <VariantManager productId={product.id} slug={product.slug} variants={variants.rows.map((row) => ({ id: row.id, size: row.size_eu, sku: row.sku, stock: row.stock, ordered: row.ordered }))} />
    <section className="admin-card">
      <div className="admin-card-heading"><h2>Riwayat stok</h2></div>
      {movements.rows.length ? <table className="admin-table"><thead><tr><th>Waktu</th><th>EU</th><th>Perubahan</th><th>Stok akhir</th><th>Alasan</th><th>Oleh</th></tr></thead><tbody>
        {movements.rows.map((row, index) => <tr key={index}>
          <td>{adminDate.format(row.created_at)}</td><td>{row.size_eu}</td>
          <td className={row.delta > 0 ? "admin-ok-text" : "admin-danger"}>{row.delta > 0 ? `+${row.delta}` : row.delta}</td><td>{row.stock_after}</td>
          <td>{row.reason}{row.order_id && <small><Link href={`/admin/orders/${row.order_id}`}>{row.order_id.slice(0, 11)}…</Link></small>}</td><td>{row.admin_name ?? "—"}</td>
        </tr>)}
      </tbody></table> : <p className="admin-empty">Belum ada perubahan stok yang tercatat.</p>}
    </section>
  </>;
}
