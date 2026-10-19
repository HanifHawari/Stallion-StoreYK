import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { MAX_WISHLIST } from "@/lib/wishlist";

export const runtime = "nodejs";

// Memindahkan wishlist lama (localStorage per perangkat) ke akun. ID pratinjau "preview-…" dipetakan
// ke ID database (lihat scripts/seed.ts); ID yang tidak dikenal diabaikan.
export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Wishlist belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const { productIds } = await readJsonObject(request, 16000);
    if (!Array.isArray(productIds) || productIds.length > 200) return jsonError("Data wishlist tidak valid.", 400);
    const ids = [...new Set(productIds.filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 100).map((id) => id.replace(/^preview-/, "")))];
    // Hanya mengisi sisa kapasitas wishlist (batas sama dengan tambah satu per satu).
    const count = (await getPool().query<{ count: number }>("SELECT COUNT(*)::integer AS count FROM wishlists WHERE customer_id = $1", [customer.id])).rows[0].count;
    const room = Math.max(0, MAX_WISHLIST - count);
    if (ids.length && room) {
      await getPool().query(`
        INSERT INTO wishlists (customer_id, product_id)
        SELECT $1, p.id FROM products p
        WHERE p.id = ANY($2::text[]) AND NOT EXISTS (SELECT 1 FROM wishlists w WHERE w.customer_id = $1 AND w.product_id = p.id)
        LIMIT $3
        ON CONFLICT DO NOTHING
      `, [customer.id, ids, room]);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Wishlist lama belum dapat dipindahkan.");
  }
}
