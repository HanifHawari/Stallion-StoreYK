import { NextResponse } from "next/server";
import { record } from "@/lib/commerce";
import { getProductsFresh } from "@/lib/db";

export const runtime = "nodejs";

type CartValidationItem = { productId: string; size: string; price: number | null; available: boolean };

// Harga & ketersediaan terkini untuk isi keranjang. Stok final tetap diverifikasi ulang saat checkout.
export async function POST(request: Request) {
  try {
    const text = await request.text();
    if (text.length > 16000) return NextResponse.json({ error: "Data keranjang terlalu besar." }, { status: 400 });
    let body: unknown;
    try { body = JSON.parse(text); } catch { return NextResponse.json({ error: "Data keranjang tidak valid." }, { status: 400 }); }
    if (!record(body) || !Array.isArray(body.items) || body.items.length > 50) return NextResponse.json({ error: "Data keranjang tidak valid." }, { status: 400 });
    const requested: { productId: string; size: string }[] = [];
    for (const raw of body.items) {
      if (!record(raw) || typeof raw.productId !== "string" || typeof raw.size !== "string" || raw.productId.length > 100 || raw.size.length > 10) {
        return NextResponse.json({ error: "Data keranjang tidak valid." }, { status: 400 });
      }
      requested.push({ productId: raw.productId, size: raw.size });
    }
    // Tanpa cache: peringatan harga/stok harus memakai data terbaru.
    const products = new Map((await getProductsFresh()).map((product) => [product.id, product]));
    const items: CartValidationItem[] = requested.map(({ productId, size }) => {
      const product = products.get(productId);
      const price = product?.price ?? null;
      return { productId, size, price, available: Boolean(product && price !== null && product.sizes.includes(size)) };
    });
    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ error: "Keranjang belum dapat diperiksa." }, { status: 503 });
  }
}
