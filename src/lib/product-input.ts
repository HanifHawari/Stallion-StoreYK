import { RequestError } from "@/lib/http";
import { SLUG_PATTERN } from "@/lib/slug";

export const CATEGORIES = ["Basketball", "Running", "Lifestyle"] as const;
export type ProductInput = {
  name: string; slug: string; brand: string; category: (typeof CATEGORIES)[number]; color: string; description: string;
  priceIdr: number | null; compareAtIdr: number | null; badge: string | null; active: boolean;
  imageUrl: string; hoverImageUrl: string | null;
  weightGrams: number | null; lengthCm: number | null; widthCm: number | null; heightCm: number | null;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
// Gambar hanya dari folder lokal: foto lama (/images/...) atau hasil upload admin (/uploads/...).
const IMAGE_PATH = /^\/(?:images|uploads)\/[A-Za-z0-9._/-]+\.(?:jpe?g|png|webp|avif|svg)$/;

function optionalInt(value: unknown, label: string, min: number, max: number): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) throw new RequestError(`${label} harus bilangan bulat ${min.toLocaleString("id-ID")}–${max.toLocaleString("id-ID")}.`);
  return number;
}
function optionalDimension(value: unknown, label: string): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number) || number <= 0 || number > 999.9) throw new RequestError(`${label} harus 0,1–999,9 cm.`);
  return Math.round(number * 10) / 10;
}
function imagePath(value: unknown, label: string, required: boolean): string | null {
  const path = text(value);
  if (!path) { if (required) throw new RequestError(`${label} wajib diisi.`); return null; }
  if (!IMAGE_PATH.test(path) || path.includes("..")) throw new RequestError(`${label} harus berupa path lokal /images/... atau /uploads/...`);
  return path;
}

export function parseProductInput(body: Record<string, unknown>): ProductInput {
  const input: ProductInput = {
    name: text(body.name), slug: text(body.slug).toLowerCase(), brand: text(body.brand),
    category: text(body.category) as ProductInput["category"], color: text(body.color), description: text(body.description),
    priceIdr: optionalInt(body.priceIdr, "Harga", 1, 2_000_000_000),
    compareAtIdr: optionalInt(body.compareAtIdr, "Harga coret", 1, 2_000_000_000),
    badge: text(body.badge).toUpperCase() || null,
    active: body.active === true,
    imageUrl: imagePath(body.imageUrl, "Foto utama", true) as string,
    hoverImageUrl: imagePath(body.hoverImageUrl, "Foto hover", false),
    weightGrams: optionalInt(body.weightGrams, "Berat paket", 1, 100_000),
    lengthCm: optionalDimension(body.lengthCm, "Panjang paket"),
    widthCm: optionalDimension(body.widthCm, "Lebar paket"),
    heightCm: optionalDimension(body.heightCm, "Tinggi paket"),
  };
  if (input.name.length < 2 || input.name.length > 120) throw new RequestError("Nama produk harus 2–120 karakter.");
  if (!SLUG_PATTERN.test(input.slug) || input.slug.length > 120) throw new RequestError("Slug hanya boleh huruf kecil, angka, dan tanda hubung.");
  if (!input.brand || input.brand.length > 60) throw new RequestError("Brand wajib diisi (maks. 60 karakter).");
  if (!CATEGORIES.includes(input.category)) throw new RequestError("Pilih kategori yang valid.");
  if (!input.color || input.color.length > 120) throw new RequestError("Warna wajib diisi (maks. 120 karakter).");
  if (input.description.length > 2000) throw new RequestError("Deskripsi maksimal 2.000 karakter.");
  if (input.badge && input.badge.length > 20) throw new RequestError("Badge maksimal 20 karakter.");
  if (input.compareAtIdr !== null && (input.priceIdr === null || input.compareAtIdr <= input.priceIdr)) throw new RequestError("Harga coret harus lebih besar dari harga jual.");
  if (input.active && input.priceIdr === null) throw new RequestError("Produk aktif wajib punya harga. Simpan sebagai draft jika harga belum ada.");
  return input;
}
