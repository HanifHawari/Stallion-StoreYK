import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { CheckoutError, parseCheckoutItems, record, RESERVATION_HOURS, type CheckoutItem } from "@/lib/commerce";
import { getShippingRates, isShippingConfigured } from "@/lib/shipping";
import { createMidtransTransaction } from "@/lib/midtrans";
import { getCurrentCustomer } from "@/lib/auth";

export const runtime = "nodejs";

type CheckoutCustomer = { name: string; email: string; phone: string; address: string; city: string; postalCode: string };
type ShippingSelection = { courierCode: string; serviceCode: string; price: number };
type VariantRow = { id: string; stock: number; active: boolean; name: string; image_url: string; price_idr: number; size_eu: string };
type OrderLine = { productId: string; variantId: string; productName: string; image: string; size: string; unitPrice: number; quantity: number };

function clean(value: unknown, max: number): string { return typeof value === "string" ? value.trim().slice(0, max + 1) : ""; }

function parseCheckout(body: unknown): { items: CheckoutItem[]; customer: CheckoutCustomer; shipping: ShippingSelection } {
  if (!record(body) || !Array.isArray(body.items) || !record(body.customer)) throw new CheckoutError("Data checkout tidak valid.");
  const items = parseCheckoutItems(body.items);
  const c = body.customer;
  const customer: CheckoutCustomer = {
    name: clean(c.name, 100), email: clean(c.email, 254).toLowerCase(),
    phone: clean(c.phone, 25), address: clean(c.address, 300),
    city: clean(c.city, 100), postalCode: clean(c.postalCode, 10),
  };
  if (customer.name.length < 2 || customer.name.length > 100 || customer.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email) ||
    !/^[+0-9 ()-]{8,25}$/.test(customer.phone) || customer.address.length < 10 ||
    customer.address.length > 300 || customer.city.length < 2 || customer.city.length > 100 || !/^[0-9]{5}$/.test(customer.postalCode)) {
    throw new CheckoutError("Lengkapi nama, email, nomor telepon, dan alamat pengiriman yang valid.");
  }
  const shipping = body.shipping;
  if (!record(shipping) || typeof shipping.courierCode !== "string" || !/^[a-z0-9_-]{1,50}$/.test(shipping.courierCode) ||
    typeof shipping.serviceCode !== "string" || !/^[a-z0-9_-]{1,50}$/.test(shipping.serviceCode) ||
    typeof shipping.price !== "number" || !Number.isSafeInteger(shipping.price) || shipping.price < 0) throw new CheckoutError("Pilih layanan pengiriman terlebih dahulu.");
  return { items, customer, shipping: { courierCode: shipping.courierCode, serviceCode: shipping.serviceCode, price: shipping.price } };
}

async function createOrder(client: PoolClient, items: CheckoutItem[], customer: CheckoutCustomer, customerId: string, shipping: ShippingSelection) {
  const lines: OrderLine[] = [];
  let subtotal = 0;
  for (const item of items) {
    const variant = await client.query<VariantRow>(`
      SELECT v.id, v.stock, v.size_eu, p.active, p.name, p.image_url, p.price_idr
      FROM product_variants v JOIN products p ON p.id = v.product_id
      WHERE v.product_id = $1 AND v.size_eu = $2
      FOR UPDATE OF v
    `, [item.productId, item.size]);
    const row = variant.rows[0];
    if (!row || !row.active) throw new CheckoutError("Salah satu sepatu tidak tersedia. Perbarui keranjang.");
    const reserved = await client.query<{ quantity: number }>(`
      SELECT COALESCE(SUM(oi.quantity), 0)::integer AS quantity
      FROM order_items oi JOIN orders o ON o.id = oi.order_id
      WHERE oi.variant_id = $1 AND o.status = 'awaiting_payment' AND o.expires_at > now()
    `, [row.id]);
    if (row.stock - reserved.rows[0].quantity < item.quantity) throw new CheckoutError(`Stok ukuran ${item.size} untuk ${row.name} tidak mencukupi.`);
    subtotal += row.price_idr * item.quantity;
    lines.push({ productId: item.productId, variantId: row.id, productName: row.name, image: row.image_url, size: row.size_eu, unitPrice: row.price_idr, quantity: item.quantity });
  }
  const rates = await getShippingRates(customer.postalCode, lines.map((line) => ({ productId: line.productId, name: line.productName, value: line.unitPrice, quantity: line.quantity })));
  const rate = rates.find((item) => item.courierCode === shipping.courierCode && item.serviceCode === shipping.serviceCode);
  if (!rate || rate.price !== shipping.price) throw new CheckoutError("Tarif ongkir berubah atau layanan tidak tersedia. Cek ongkir kembali sebelum membayar.", 409);
  const total = subtotal + rate.price;
  if (!Number.isSafeInteger(total) || total > 2_000_000_000) throw new CheckoutError("Total transaksi melebihi batas checkout.");
  const orderId = `ST-${randomUUID()}`;
  const createdAt = new Date();
  const expiresAt = new Date(createdAt.getTime() + RESERVATION_HOURS * 60 * 60 * 1000);
  await client.query(`
    INSERT INTO orders (id, customer_name, customer_email, customer_phone, shipping_address,
      shipping_city, shipping_postal_code, subtotal_idr, shipping_idr, total_idr, status, expires_at, created_at, customer_id, shipping_courier_code, shipping_service_code)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'awaiting_payment',$11,$12,$13,$14,$15)
  `, [orderId, customer.name, customer.email, customer.phone, customer.address, customer.city, customer.postalCode, subtotal, rate.price, total, expiresAt, createdAt, customerId, rate.courierCode, rate.serviceCode]);
  for (const line of lines) {
    await client.query(`
      INSERT INTO order_items (id, order_id, variant_id, product_name, size_eu, image_url, unit_price_idr, quantity)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    `, [randomUUID(), orderId, line.variantId, line.productName, line.size, line.image, line.unitPrice, line.quantity]);
  }
  return { orderId, total, createdAt };
}

export async function POST(request: Request) {
  if (!isShippingConfigured()) return NextResponse.json({ error: "Tarif pengiriman belum tersedia. Silakan coba lagi nanti." }, { status: 503 });
  if (!process.env.DATABASE_URL || !process.env.MIDTRANS_SERVER_KEY || !process.env.PUBLIC_SITE_URL) {
    return NextResponse.json({ error: "Checkout belum dikonfigurasi oleh pengelola toko." }, { status: 503 });
  }
  let user;
  try { user = await getCurrentCustomer(); }
  catch { return NextResponse.json({ error: "Sesi akun belum dapat diperiksa." }, { status: 503 }); }
  if (!user) return NextResponse.json({ error: "Login diperlukan untuk checkout." }, { status: 401 });
  let input: ReturnType<typeof parseCheckout>;
  try {
    const text = await request.text();
    if (text.length > 16000) throw new CheckoutError("Data checkout terlalu besar.");
    input = parseCheckout(JSON.parse(text) as unknown);
  } catch (error) {
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : "Data checkout tidak valid." }, { status: 400 });
  }
  let siteUrl: URL;
  try {
    siteUrl = new URL(process.env.PUBLIC_SITE_URL);
    if (!(["https:", "http:"].includes(siteUrl.protocol)) || (process.env.MIDTRANS_IS_PRODUCTION === "true" && siteUrl.protocol !== "https:")) throw new Error();
  } catch {
    return NextResponse.json({ error: "Alamat website belum dikonfigurasi dengan benar." }, { status: 503 });
  }
  const pool = getPool();
  let order: Awaited<ReturnType<typeof createOrder>>;
  let client: PoolClient;
  try {
    client = await pool.connect();
  } catch {
    return NextResponse.json({ error: "Database toko belum tersedia. Silakan coba lagi nanti." }, { status: 503 });
  }
  try {
    await client.query("BEGIN");
    order = await createOrder(client, input.items, input.customer, user.id, input.shipping);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    return NextResponse.json({ error: error instanceof CheckoutError ? error.message : "Pesanan belum bisa dibuat. Coba lagi." }, { status: error instanceof CheckoutError ? error.status : 500 });
  } finally {
    client.release();
  }
  try {
    const finishUrl = new URL(`/order/${order.orderId}`, siteUrl).toString();
    const redirectUrl = await createMidtransTransaction({
      orderId: order.orderId, total: order.total, name: input.customer.name,
      email: input.customer.email, phone: input.customer.phone,
      finishUrl, createdAt: order.createdAt,
    });
    await pool.query("UPDATE orders SET payment_url = $2 WHERE id = $1", [order.orderId, redirectUrl]);
    return NextResponse.json({ orderId: order.orderId, redirectUrl });
  } catch (error) {
    await pool.query("UPDATE orders SET status = 'payment_setup_failed' WHERE id = $1 AND status = 'awaiting_payment'", [order.orderId]);
    console.error("Midtrans checkout failed:", error instanceof Error ? error.message : "unknown error");
    return NextResponse.json({ error: "Halaman pembayaran belum tersedia. Silakan coba lagi." }, { status: 502 });
  }
}

