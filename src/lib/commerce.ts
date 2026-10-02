export const RESERVATION_HOURS = 24;

export type CheckoutItem = { productId: string; size: string; quantity: number };
export type ShippingRate = { courierCode: string; serviceCode: string; courierName: string; serviceName: string; duration: string; price: number };

export class CheckoutError extends Error { constructor(message: string, public status = 400) { super(message); } }
export function record(value: unknown): value is Record<string, unknown> { return typeof value === "object" && value !== null && !Array.isArray(value); }

export function isShippingRate(value: unknown): value is ShippingRate {
  return record(value) && typeof value.courierCode === "string" && typeof value.serviceCode === "string" &&
    typeof value.courierName === "string" && typeof value.serviceName === "string" && typeof value.duration === "string" &&
    typeof value.price === "number" && Number.isSafeInteger(value.price) && value.price >= 0;
}

export function parseCheckoutItems(items: unknown): CheckoutItem[] {
  if (!Array.isArray(items) || items.length < 1 || items.length > 10) throw new CheckoutError("Keranjang harus berisi 1 sampai 10 varian sepatu.");
  const byKey = new Map<string, CheckoutItem>();
  for (const raw of items) {
    if (!record(raw)) throw new CheckoutError("Produk tidak valid.");
    const productId = typeof raw.productId === "string" ? raw.productId.trim() : "";
    const size = typeof raw.size === "string" ? raw.size.trim() : "";
    const quantity = raw.quantity;
    if (!productId || productId.length > 100 || !size || size.length > 10 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1 || quantity > 10) throw new CheckoutError("Ukuran atau jumlah sepatu tidak valid.");
    const key = `${productId}:${size}`;
    const totalQuantity = (byKey.get(key)?.quantity ?? 0) + quantity;
    if (totalQuantity > 10) throw new CheckoutError("Maksimal 10 pasang per ukuran.");
    byKey.set(key, { productId, size, quantity: totalQuantity });
  }
  return [...byKey.values()].sort((a, b) => `${a.productId}:${a.size}`.localeCompare(`${b.productId}:${b.size}`));
}

export type OrderStatus =
  | "awaiting_payment"
  | "paid"
  | "failed"
  | "expired"
  | "cancelled"
  | "payment_setup_failed"
  | "stock_issue";
