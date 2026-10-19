import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { MAX_WISHLIST } from "@/lib/wishlist";

export const runtime = "nodejs";

const validProductId = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= 100;

export async function GET() {
  if (!process.env.DATABASE_URL) return jsonError("Wishlist belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const rows = (await getPool().query<{ product_id: string }>("SELECT product_id FROM wishlists WHERE customer_id = $1 ORDER BY created_at DESC", [customer.id])).rows;
    return NextResponse.json({ productIds: rows.map((row) => row.product_id) });
  } catch (error) {
    return errorResponse(error, "Wishlist belum dapat dimuat.");
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Wishlist belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const { productId } = await readJsonObject(request, 512);
    if (!validProductId(productId)) return jsonError("Produk tidak valid.", 400);
    const exists = (await getPool().query("SELECT 1 FROM products WHERE id = $1", [productId])).rowCount;
    if (!exists) return jsonError("Produk tidak ditemukan.", 404);
    const count = (await getPool().query<{ count: number }>("SELECT COUNT(*)::integer AS count FROM wishlists WHERE customer_id = $1", [customer.id])).rows[0].count;
    if (count >= MAX_WISHLIST) return jsonError(`Wishlist maksimal ${MAX_WISHLIST} sepatu.`, 409);
    await getPool().query("INSERT INTO wishlists (customer_id, product_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [customer.id, productId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Wishlist belum dapat disimpan.");
  }
}

export async function DELETE(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Wishlist belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const productId = new URL(request.url).searchParams.get("productId");
    if (!validProductId(productId)) return jsonError("Produk tidak valid.", 400);
    await getPool().query("DELETE FROM wishlists WHERE customer_id = $1 AND product_id = $2", [customer.id, productId]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse(error, "Wishlist belum dapat diperbarui.");
  }
}
