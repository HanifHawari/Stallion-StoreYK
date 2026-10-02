import { Pool } from "pg";
import { previewProducts, type Product } from "@/lib/catalog";

let pool: Pool | undefined;

export function getPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL belum dikonfigurasi.");
  pool ??= new Pool({ connectionString, max: 10 });
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

export async function getProducts(): Promise<Product[]> {
  if (!process.env.DATABASE_URL) return previewProducts;
  const result = await getPool().query<ProductRow>(`
    SELECT p.id, p.slug, p.name, p.brand, p.category, p.color,
      p.image_url, p.hover_image_url, p.price_idr, p.compare_at_idr, p.badge, p.description,
      COALESCE(array_agg(v.size_eu ORDER BY v.size_value)
        FILTER (WHERE v.id IS NOT NULL AND v.stock > 0), ARRAY[]::text[]) AS sizes
    FROM products p
    LEFT JOIN product_variants v ON v.product_id = p.id
    WHERE p.active = true
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `);
  return result.rows.map(fromRow);
}
