import { Pool } from "pg";
import { revalidateTag, unstable_cache } from "next/cache";
import { previewProducts, type Product } from "@/lib/catalog";
import { normalizeDatabaseUrl } from "@/lib/database-url";

let pool: Pool | undefined;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum dikonfigurasi.");
  // Batas waktu koneksi: saat server database mati/dijeda, request gagal cepat (lalu situs masuk mode maintenance)
  // alih-alih menunggu tanpa batas.
  pool ??= new Pool({ connectionString: normalizeDatabaseUrl(connectionString), max: 10, connectionTimeoutMillis: 5000 });
  return pool;
}

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Product["category"];
  color: string;
  image_url: string;
  hover_image_url: string | null;
  price_idr: number;
  compare_at_idr: number | null;
  badge: string | null;
  description: string;
  sizes: string[];
};

function fromRow(row: ProductRow): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    brand: row.brand,
    category: row.category,
    color: row.color,
    image: row.image_url,
    hoverImage: row.hover_image_url ?? undefined,
    price: row.price_idr,
    compareAt: row.compare_at_idr,
    sizes: row.sizes,
    badge: row.badge ?? undefined,
    description: row.description,
  };
}

const PRODUCT_SELECT = `
  SELECT p.id, p.slug, p.name, p.brand, p.category, p.color,
    p.image_url, p.hover_image_url, p.price_idr, p.compare_at_idr, p.badge, p.description,
    COALESCE(array_agg(v.size_eu ORDER BY v.size_value)
      FILTER (WHERE v.id IS NOT NULL AND v.stock > 0), ARRAY[]::text[]) AS sizes
  FROM products p
  LEFT JOIN product_variants v ON v.product_id = p.id
`;

async function queryProducts(): Promise<Product[]> {
  const result = await getPool().query<ProductRow>(`${PRODUCT_SELECT} WHERE p.active = true GROUP BY p.id ORDER BY p.created_at DESC`);
  return result.rows.map(fromRow);
}

async function queryProductBySlug(slug: string): Promise<Product | null> {
  const result = await getPool().query<ProductRow>(`${PRODUCT_SELECT} WHERE p.active = true AND p.slug = $1 GROUP BY p.id`, [slug]);
  return result.rows[0] ? fromRow(result.rows[0]) : null;
}

// Cache katalog untuk halaman toko. Dihapus seketika lewat invalidateProducts() setiap kali admin
// mengubah produk/stok atau pembayaran memotong stok; `revalidate` hanya jaring pengaman.
const PRODUCTS_TAG = "products";
const cachedProducts = unstable_cache(queryProducts, ["products-active"], { tags: [PRODUCTS_TAG], revalidate: 300 });
const cachedProductBySlug = unstable_cache(queryProductBySlug, ["product-by-slug"], { tags: [PRODUCTS_TAG], revalidate: 300 });

export async function getProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return previewProducts;
  return cachedProducts();
}

// Tanpa cache: untuk keputusan yang harus memakai stok terbaru (validasi keranjang).
export async function getProductsFresh(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return previewProducts;
  return queryProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!process.env.DATABASE_URL) return previewProducts.find((product) => product.slug === slug) ?? null;
  return cachedProductBySlug(slug);
}

export function invalidateProducts(): void {
  // Di luar konteks request Next (mis. script CLI) fungsi ini tidak tersedia; abaikan.
  try { revalidateTag(PRODUCTS_TAG, { expire: 0 }); } catch { /* bukan dalam request */ }
}
