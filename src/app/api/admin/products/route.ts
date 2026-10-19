import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin";
import { getPool, invalidateProducts } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { parseProductInput } from "@/lib/product-input";

export const runtime = "nodejs";

const isUniqueViolation = (error: unknown) => typeof error === "object" && error !== null && "code" in error && error.code === "23505";

export async function POST(request: Request) {
  try {
    await requireAdminApi();
    const input = parseProductInput(await readJsonObject(request, 16000));
    // ID = slug saat dibuat (tetap walau slug diganti kemudian); tambah akhiran jika sudah terpakai.
    let id = input.slug;
    for (let suffix = 2; (await getPool().query("SELECT 1 FROM products WHERE id = $1", [id])).rowCount; suffix++) id = `${input.slug}-${suffix}`;
    await getPool().query(`
      INSERT INTO products (id, slug, name, brand, category, color, image_url, hover_image_url, description, price_idr, compare_at_idr, badge, active,
        weight_grams, length_cm, width_cm, height_cm)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
    `, [id, input.slug, input.name, input.brand, input.category, input.color, input.imageUrl, input.hoverImageUrl, input.description,
      input.priceIdr, input.compareAtIdr, input.badge, input.active, input.weightGrams, input.lengthCm, input.widthCm, input.heightCm]);
    invalidateProducts();
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    if (isUniqueViolation(error)) return jsonError("Slug sudah dipakai produk lain.", 409);
    return errorResponse(error, "Produk belum dapat disimpan.");
  }
}
