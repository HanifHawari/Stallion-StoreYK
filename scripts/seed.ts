// Mengisi products + product_variants dari katalog pratinjau (src/lib/catalog.ts).
// Pemakaian: npm run db:seed            → stok semua ukuran 0 (data toko asli diisi lewat admin)
//            npm run db:seed -- --demo-stock=5  → stok demo untuk mencoba checkout di lokal
// Idempotent: produk/varian yang sudah ada tidak ditimpa.
import { Client } from "pg";
import { previewProducts } from "../src/lib/catalog";
import { requireDatabaseUrl } from "./env";

// ID di DB = ID pratinjau tanpa awalan "preview-" (mis. "preview-ja-4" → "ja-4").
function databaseProductId(previewId: string): string {
  return previewId.replace(/^preview-/, "");
}

function demoStock(): number {
  const flag = process.argv.find((arg) => arg.startsWith("--demo-stock="));
  if (!flag) return 0;
  const value = Number(flag.split("=")[1]);
  if (!Number.isSafeInteger(value) || value < 0 || value > 1000) {
    console.error("--demo-stock harus bilangan bulat 0–1000.");
    process.exit(1);
  }
  return value;
}

async function main() {
  const stock = demoStock();
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  // created_at menurun mengikuti urutan katalog, agar urutan tampil (ORDER BY created_at DESC) sama seperti mode pratinjau.
  const base = Date.now();
  let products = 0;
  let variants = 0;
  try {
    await client.query("BEGIN");
    for (const [index, product] of previewProducts.entries()) {
      const id = databaseProductId(product.id);
      const active = product.price !== null;
      const inserted = await client.query(`
        INSERT INTO products (id, slug, name, brand, category, color, image_url, hover_image_url, description,
          price_idr, compare_at_idr, badge, active, created_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING
      `, [id, product.slug, product.name, product.brand, product.category, product.color, product.image, product.hoverImage ?? null,
        product.description, product.price, product.compareAt, product.badge ?? null, active, new Date(base - index * 1000)]);
      products += inserted.rowCount ?? 0;
      for (const size of product.sizes) {
        const result = await client.query(`
          INSERT INTO product_variants (id, product_id, size_eu, size_value, sku, stock)
          VALUES ($1,$2,$3,$4,$5,$6)
          ON CONFLICT DO NOTHING
        `, [`${id}-${size}`, id, size, Number(size), `${product.slug}-${size}`.toUpperCase(), stock]);
        variants += result.rowCount ?? 0;
      }
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
  const drafts = previewProducts.filter((product) => product.price === null).length;
  console.log(`✓ ${products} produk & ${variants} varian ditambahkan (stok per ukuran: ${stock}).`);
  console.log(`  ${drafts} produk belum punya harga disimpan sebagai draft (active=false).`);
  if (!stock) console.log("  Stok 0: ukuran belum tampil di toko sampai stok diisi. Untuk demo lokal: npm run db:seed -- --demo-stock=5");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
