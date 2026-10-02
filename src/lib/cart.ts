import type { Product } from "@/lib/catalog";

export type CartItem = {
  key: string;
  productId: string;
  slug: string;
  name: string;
  brand: string;
  image: string;
  size: string;
  price: number;
  quantity: number;
  preview: boolean;
};

const CART_KEY = "stallion-store-cart-v1";

export function readCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is CartItem =>
      typeof item === "object" && item !== null &&
      typeof item.key === "string" && typeof item.productId === "string" &&
      typeof item.slug === "string" && typeof item.brand === "string" && typeof item.preview === "boolean" &&
      typeof item.size === "string" && typeof item.name === "string" &&
      typeof item.image === "string" && typeof item.price === "number" &&
      Number.isSafeInteger(item.price) && item.price > 0 &&
      Number.isInteger(item.quantity) && item.quantity > 0 && item.quantity <= 10
    );
  } catch {
    return [];
  }
}

export function writeCart(items: CartItem[]): boolean {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    window.dispatchEvent(new Event("stallion-cart-change"));
    return true;
  } catch { return false; }
}

export function addToCart(product: Product, size: string): boolean {
  if (!product.price || !product.sizes.includes(size)) return false;
  const items = readCart();
  const key = `${product.id}:${size}`;
  const existing = items.find((item) => item.key === key);
  if (existing) existing.quantity = Math.min(existing.quantity + 1, 10);
  else items.push({
    key,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    image: product.image,
    size,
    price: product.price,
    quantity: 1,
    preview: Boolean(product.preview),
  });
  return writeCart(items);
}
