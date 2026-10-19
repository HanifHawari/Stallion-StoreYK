import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { record } from "@/lib/commerce";
import { getPool, invalidateProducts } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject, RequestError } from "@/lib/http";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string }> };
type VariantInput = { id: string | null; size: string; sku: string; stock: number; originalStock: number | null };

function parseVariants(body: Record<string, unknown>): { variants: VariantInput[]; reason: string } {
  const reason = typeof body.reason === "string" ? body.reason.trim() : "";
  if (reason.length < 2 || reason.length > 120) throw new RequestError("Isi alasan perubahan stok (2–120 karakter).");
  if (!Array.isArray(body.variants) || body.variants.length > 40) throw new RequestError("Data ukuran tidak valid.");
  const seen = new Set<string>();
  const variants = body.variants.map((raw): VariantInput => {
    if (!record(raw)) throw new RequestError("Data ukuran tidak valid.");
    const size = typeof raw.size === "string" ? raw.size.trim() : "";
    const sku = typeof raw.sku === "string" ? raw.sku.trim().toUpperCase() : "";
    const stock = typeof raw.stock === "number" ? raw.stock : Number(raw.stock);
    if (!/^\d{1,2}(\.\d)?$/.test(size)) throw new RequestError(`Ukuran "${size}" tidak valid. Gunakan ukuran EU seperti 42 atau 42.5.`);
    if (seen.has(size)) throw new RequestError(`Ukuran ${size} tercantum dua kali.`);
    seen.add(size);
    if (!/^[A-Z0-9._-]{2,80}$/.test(sku)) throw new RequestError(`SKU ukuran ${size} tidak valid (huruf, angka, titik, tanda hubung).`);
    if (!Number.isSafeInteger(stock) || stock < 0 || stock > 100_000) throw new RequestError(`Stok ukuran ${size} harus 0–100.000.`);
    const id = typeof raw.id === "string" && raw.id ? raw.id : null;
    // Stok yang terlihat admin saat halaman dibuka; wajib untuk ukuran yang sudah ada (cek bentrok perubahan).
    const originalStock = typeof raw.originalStock === "number" && Number.isSafeInteger(raw.originalStock) ? raw.originalStock : null;
    if (id && originalStock === null) throw new RequestError("Data stok tidak lengkap. Muat ulang halaman.", 409);
    return { id, size, sku, stock, originalStock };
  });
  return { variants, reason };
}

// Simpan semua ukuran sekaligus (ubah stok massal). Setiap selisih stok dicatat di stock_movements.
export async function PUT(request: Request, { params }: Context) {
  let client: PoolClient | undefined;
  try {
    const admin = await requireAdminApi();
    const { id: productId } = await params;
    const { variants, reason } = parseVariants(await readJsonObject(request, 32000));
    client = await getPool().connect();
    await client.query("BEGIN");
    const product = (await client.query("SELECT id FROM products WHERE id = $1 FOR UPDATE", [productId])).rows[0];
    if (!product) { await client.query("ROLLBACK"); return jsonError("Produk tidak ditemukan.", 404); }
    const current = new Map((await client.query<{ id: string; size_eu: string; stock: number; sku: string }>(
      "SELECT id, size_eu, stock, sku FROM product_variants WHERE product_id = $1 FOR UPDATE", [productId],
    )).rows.map((row) => [row.id, row]));
    let changes = 0;
    for (const variant of variants) {
      if (variant.id) {
        const existing = current.get(variant.id);
        if (!existing) throw new RequestError("Salah satu ukuran tidak ditemukan. Muat ulang halaman.", 409);
        if (existing.size_eu !== variant.size) throw new RequestError("Ukuran yang sudah ada tidak bisa diganti. Tambahkan ukuran baru.", 409);
        // Baris yang tidak diubah admin dilewati, agar stok terbaru (mis. setelah penjualan) tidak tertimpa angka lama.
        if (variant.stock === variant.originalStock && variant.sku === existing.sku) continue;
        if (existing.stock !== variant.originalStock) throw new RequestError(`Stok EU ${variant.size} berubah sejak halaman dibuka (sekarang ${existing.stock}, mungkin ada penjualan). Muat ulang halaman lalu ulangi.`, 409);
        await client.query("UPDATE product_variants SET sku = $2, stock = $3 WHERE id = $1", [variant.id, variant.sku, variant.stock]);
        const delta = variant.stock - existing.stock;
        if (delta) {
          changes++;
          await client.query("INSERT INTO stock_movements (id, variant_id, delta, stock_after, reason, admin_id) VALUES ($1,$2,$3,$4,$5,$6)", [randomUUID(), variant.id, delta, variant.stock, reason, admin.id]);
        }
      } else {
        const variantId = `${productId}-${variant.size}`;
        if ([...current.values()].some((row) => row.size_eu === variant.size)) throw new RequestError(`Ukuran ${variant.size} sudah ada.`, 409);
        await client.query("INSERT INTO product_variants (id, product_id, size_eu, size_value, sku, stock) VALUES ($1,$2,$3,$4,$5,$6)",
          [variantId, productId, variant.size, Number(variant.size), variant.sku, variant.stock]);
        changes++;
        if (variant.stock) await client.query("INSERT INTO stock_movements (id, variant_id, delta, stock_after, reason, admin_id) VALUES ($1,$2,$3,$4,$5,$6)", [randomUUID(), variantId, variant.stock, variant.stock, reason, admin.id]);
      }
    }
    await client.query("UPDATE products SET updated_at = now() WHERE id = $1", [productId]);
    await client.query("COMMIT");
    invalidateProducts();
    return NextResponse.json({ ok: true, changes });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return jsonError("SKU atau ukuran sudah dipakai varian lain.", 409);
    return errorResponse(error, "Stok belum dapat disimpan.");
  } finally {
    client?.release();
  }
}

// Hapus ukuran yang belum pernah dipesan. Ukuran yang pernah dipesan cukup diberi stok 0.
export async function DELETE(request: Request, { params }: Context) {
  try {
    await requireAdminApi();
    const { id: productId } = await params;
    const variantId = new URL(request.url).searchParams.get("variantId") ?? "";
    const used = (await getPool().query("SELECT 1 FROM order_items WHERE variant_id = $1 LIMIT 1", [variantId])).rowCount;
    if (used) return jsonError("Ukuran ini sudah pernah dipesan sehingga tidak bisa dihapus. Ubah stoknya menjadi 0 untuk menyembunyikannya.", 409);
    const result = await getPool().query("DELETE FROM product_variants WHERE id = $1 AND product_id = $2", [variantId, productId]);
    if (!result.rowCount) return jsonError("Ukuran tidak ditemukan.", 404);
    invalidateProducts();
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Ukuran belum dapat dihapus.");
  }
}
