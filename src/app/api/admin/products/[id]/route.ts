import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getPool, invalidateProducts } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { parseProductInput } from "@/lib/product-input";

export const runtime = "nodejs";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdminApi();
    const { id } = await params;
    const input = parseProductInput(await readJsonObject(request, 16000));
    const result = await getPool().query(`
      UPDATE products SET slug = $2, name = $3, brand = $4, category = $5, color = $6, image_url = $7, hover_image_url = $8, description = $9,
        price_idr = $10, compare_at_idr = $11, badge = $12, active = $13, weight_grams = $14, length_cm = $15, width_cm = $16, height_cm = $17, updated_at = now()
      WHERE id = $1
    `, [id, input.slug, input.name, input.brand, input.category, input.color, input.imageUrl, input.hoverImageUrl, input.description,
      input.priceIdr, input.compareAtIdr, input.badge, input.active, input.weightGrams, input.lengthCm, input.widthCm, input.heightCm]);
    if (!result.rowCount) return jsonError("Produk tidak ditemukan.", 404);
    invalidateProducts();
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") return jsonError("Slug sudah dipakai produk lain.", 409);
    return errorResponse(error, "Produk belum dapat disimpan.");
  }
}
