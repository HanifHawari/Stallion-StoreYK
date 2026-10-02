import { CheckoutError, record, type ShippingRate } from "@/lib/commerce";

export type ShippingItem = { productId: string; name: string; value: number; quantity: number };

function configuration() {
  const apiKey = process.env.BITESHIP_API_KEY?.trim();
  if (process.env.MIDTRANS_IS_PRODUCTION === "true" && !apiKey?.startsWith("biteship_live.")) {
    throw new CheckoutError("Tarif pengiriman belum tersedia. Silakan coba lagi nanti.", 503);
  }
  const origin = process.env.SHIPPING_ORIGIN_POSTAL_CODE?.trim() ?? "";
  const couriers = process.env.SHIPPING_COURIERS?.trim() || "jne,sicepat,anteraja";
  let packages: unknown;
  try { packages = JSON.parse(process.env.SHIPPING_PACKAGES_JSON ?? "{}"); }
  catch { throw new CheckoutError("Tarif pengiriman belum tersedia. Silakan coba lagi nanti.", 503); }
  if (!apiKey || !/^[0-9]{5}$/.test(origin) || !/^[a-z0-9_]+(,[a-z0-9_]+)*$/.test(couriers) || !record(packages) || !Object.keys(packages).length) {
    throw new CheckoutError("Tarif pengiriman belum tersedia. Silakan coba lagi nanti.", 503);
  }
  return { apiKey, origin: Number(origin), couriers, packages };
}

export function isShippingConfigured(): boolean {
  try { configuration(); return true; } catch { return false; }
}

export async function getShippingRates(postalCode: string, items: ShippingItem[]): Promise<ShippingRate[]> {
  const config = configuration();
  if (!/^[0-9]{5}$/.test(postalCode)) throw new CheckoutError("Masukkan kode pos tujuan yang valid.");
  const packages = items.map((item) => {
    const box = config.packages[item.productId];
    if (!record(box) || typeof box.weight !== "number" || !Number.isSafeInteger(box.weight) || box.weight <= 0) {
      throw new CheckoutError("Tarif pengiriman untuk salah satu produk belum tersedia.", 503);
    }
    const dimensions: Partial<Record<"length" | "width" | "height", number>> = {};
    for (const dimension of ["length", "width", "height"] as const) {
      const value = box[dimension];
      if (value === undefined) continue;
      if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) throw new CheckoutError("Tarif pengiriman untuk salah satu produk belum tersedia.", 503);
      dimensions[dimension] = value;
    }
    return { name: item.name, value: item.value, quantity: item.quantity, weight: box.weight, ...dimensions };
  });
  let response: Response;
  try {
    response = await fetch("https://api.biteship.com/v1/rates/couriers", {
      method: "POST", headers: { Authorization: config.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ origin_postal_code: config.origin, destination_postal_code: Number(postalCode), couriers: config.couriers, items: packages }),
      cache: "no-store", signal: AbortSignal.timeout(12000),
    });
  } catch { throw new CheckoutError("Tarif pengiriman belum dapat diperiksa. Silakan coba lagi.", 502); }
  if (!response.ok) throw new CheckoutError("Tarif pengiriman belum dapat diperiksa. Silakan coba lagi.", 502);
  let data: unknown;
  try { data = await response.json(); }
  catch { throw new CheckoutError("Respons tarif pengiriman tidak valid.", 502); }
  if (!record(data) || data.success !== true || !Array.isArray(data.pricing)) throw new CheckoutError("Respons tarif pengiriman tidak valid.", 502);
  const rates: ShippingRate[] = [];
  for (const entry of data.pricing) {
    if (!record(entry) || (entry.currency !== undefined && entry.currency !== "IDR") || typeof entry.courier_code !== "string" || typeof entry.courier_service_code !== "string" ||
      typeof entry.courier_name !== "string" || typeof entry.courier_service_name !== "string" || typeof entry.price !== "number" || !Number.isSafeInteger(entry.price) || entry.price < 0) continue;
    rates.push({ courierCode: entry.courier_code, serviceCode: entry.courier_service_code, courierName: entry.courier_name, serviceName: entry.courier_service_name, duration: typeof entry.duration === "string" ? entry.duration : "", price: entry.price });
  }
  if (!rates.length) throw new CheckoutError("Belum ada layanan kurir untuk tujuan ini.", 422);
  return rates.sort((a, b) => a.price - b.price);
}
