import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth";
import { CheckoutError, parseCheckoutItems, record } from "@/lib/commerce";
import { getPool } from "@/lib/db";
import { CHECKOUT_CLOSED_MESSAGE, DEV_MODE } from "@/lib/flags";
import { getShippingRates, isShippingConfigured, type ShippingItem } from "@/lib/shipping";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (DEV_MODE) return NextResponse.json({ error: CHECKOUT_CLOSED_MESSAGE }, { status: 503 });
  if (!isShippingConfigured() || !process.env.DATABASE_URL) return NextResponse.json({ error: "Tarif pengiriman belum tersedia. Silakan coba lagi nanti." }, { status: 503 });
  try {
    if (!await getCurrentCustomer()) return NextResponse.json({ error: "Login diperlukan untuk checkout." }, { status: 401 });
    const text = await request.text();
    if (text.length > 16000) throw new CheckoutError("Data pengiriman terlalu besar.");
    let body: unknown;
    try { body = JSON.parse(text); } catch { throw new CheckoutError("Data pengiriman tidak valid."); }
    if (!record(body) || typeof body.postalCode !== "string" || !/^[0-9]{5}$/.test(body.postalCode)) throw new CheckoutError("Masukkan kode pos tujuan yang valid.");
    const items = parseCheckoutItems(body.items);
    const packages: ShippingItem[] = [];
    for (const item of items) {
      const result = await getPool().query<{ id: string; name: string; price_idr: number }>(`
        SELECT p.id, p.name, p.price_idr FROM product_variants v JOIN products p ON p.id = v.product_id
        WHERE v.product_id = $1 AND v.size_eu = $2 AND p.active = true AND v.stock > 0
      `, [item.productId, item.size]);
      const product = result.rows[0];
      if (!product) throw new CheckoutError("Salah satu sepatu tidak tersedia. Perbarui keranjang.");
      packages.push({ productId: product.id, name: product.name, value: product.price_idr, quantity: item.quantity });
    }
    return NextResponse.json({ rates: await getShippingRates(body.postalCode, packages) });
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : "Tarif pengiriman belum dapat diperiksa. Silakan coba lagi." }, { status: error instanceof CheckoutError ? error.status : 503 });
  }
}
