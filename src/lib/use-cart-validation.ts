"use client";

import { useEffect, useState } from "react";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { record } from "@/lib/commerce";

export type CartValidation = { unavailable: CartItem[]; priceUpdated: boolean };

// Mencocokkan keranjang (localStorage) dengan harga & ketersediaan terkini di server.
// Hanya field `price` yang diperbarui; data lain (nama, foto, ukuran) tidak disentuh.
export function useCartValidation(items: CartItem[] | null): CartValidation {
  const [result, setResult] = useState<CartValidation>({ unavailable: [], priceUpdated: false });
  const signature = items ? items.map((item) => `${item.key}=${item.price}`).join("|") : null;

  useEffect(() => {
    if (!items || !items.length) return;
    const controller = new AbortController();
    fetch("/api/cart/validate", {
      method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
      body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, size: item.size })) }),
    }).then((response) => response.ok ? response.json() : null).then((data: unknown) => {
      if (controller.signal.aborted || !record(data) || !Array.isArray(data.items)) return;
      const latest = new Map<string, { price: number | null; available: boolean }>();
      for (const entry of data.items) {
        if (record(entry) && typeof entry.productId === "string" && typeof entry.size === "string" && typeof entry.available === "boolean" &&
          (entry.price === null || (typeof entry.price === "number" && Number.isSafeInteger(entry.price) && entry.price > 0))) {
          latest.set(`${entry.productId}:${entry.size}`, { price: entry.price as number | null, available: entry.available });
        }
      }
      const unavailable = items.filter((item) => latest.get(item.key)?.available === false);
      const stored = readCart();
      let changed = false;
      const updated = stored.map((item) => {
        const price = latest.get(item.key)?.price;
        if (typeof price === "number" && price !== item.price) { changed = true; return { ...item, price }; }
        return item;
      });
      setResult((previous) => ({ unavailable, priceUpdated: previous.priceUpdated || changed }));
      if (changed) writeCart(updated);
    }).catch(() => { /* Validasi gagal: keranjang tetap bisa dipakai, server memeriksa ulang saat checkout. */ });
    return () => controller.abort();
    // `signature` mewakili isi keranjang; `items` sendiri berganti referensi di setiap render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (!items || !items.length) return { unavailable: [], priceUpdated: false };
  const current = new Set(items.map((item) => item.key));
  return { unavailable: result.unavailable.filter((item) => current.has(item.key)), priceUpdated: result.priceUpdated };
}
