"use client";

import { useEffect, useSyncExternalStore } from "react";

// Wishlist akun disimpan di database. Semua kartu produk di satu halaman berbagi state ini,
// sehingga hanya ada satu request GET per halaman (bukan satu per kartu).
type WishlistState = { customerId: string | null; ids: ReadonlySet<string> };

const LEGACY_KEY_PREFIX = "stallion-store-wishlist-v1:";
const EMPTY: WishlistState = { customerId: null, ids: new Set() };
let state: WishlistState = EMPTY;
let loadingFor: string | null = null;
let loaded: { customerId: string; at: number } | null = null;
const RELOAD_AFTER_MS = 30_000;
// Klik hati selama wishlist dimuat tidak boleh tertimpa respons yang lebih lama.
let mutations = 0;
let inFlight = 0;
let reloadAfterToggles = false;
const listeners = new Set<() => void>();

function setState(next: WishlistState) { state = next; listeners.forEach((listener) => listener()); }
function subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; }

async function importLegacy(customerId: string) {
  let raw: string | null = null;
  try { raw = localStorage.getItem(LEGACY_KEY_PREFIX + customerId); } catch { return; }
  if (raw === null) return;
  let ids: string[] = [];
  try { const parsed: unknown = JSON.parse(raw); if (Array.isArray(parsed)) ids = parsed.filter((id): id is string => typeof id === "string").slice(0, 200); } catch { /* Data lama rusak: dibuang. */ }
  const response = ids.length ? await fetch("/api/wishlist/import", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productIds: ids }) }) : null;
  if (!response || response.ok) { try { localStorage.removeItem(LEGACY_KEY_PREFIX + customerId); } catch { /* Abaikan. */ } }
}

async function load(customerId: string) {
  try {
    await importLegacy(customerId);
    for (let attempt = 0; attempt < 3; attempt++) {
      const version = mutations;
      const response = await fetch("/api/wishlist", { cache: "no-store" });
      if (!response.ok) return;
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null || !("productIds" in data) || !Array.isArray(data.productIds)) return;
      if (state.customerId !== customerId) return;
      if (inFlight > 0) { reloadAfterToggles = true; return; }
      if (mutations !== version) continue;
      setState({ customerId, ids: new Set(data.productIds.filter((id): id is string => typeof id === "string")) });
      loaded = { customerId, at: Date.now() };
      return;
    }
  } catch { /* Jaringan gagal: wishlist tampil kosong, kartu tetap bisa dipakai. */ }
  finally { if (loadingFor === customerId) loadingFor = null; }
}

// Hasil klik hati: `added` = arah perubahan, `ok` = server berhasil menyimpan (untuk notifikasi).
export type WishlistToggleResult = { added: boolean; ok: boolean };

async function toggle(customerId: string, productId: string): Promise<WishlistToggleResult> {
  if (state.customerId !== customerId) return { added: false, ok: false };
  mutations++;
  inFlight++;
  const had = state.ids.has(productId);
  const optimistic = new Set(state.ids);
  if (had) optimistic.delete(productId); else optimistic.add(productId);
  setState({ customerId, ids: optimistic });
  try {
    const response = had
      ? await fetch(`/api/wishlist?productId=${encodeURIComponent(productId)}`, { method: "DELETE" })
      : await fetch("/api/wishlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
    if (!response.ok) throw new Error("Wishlist gagal diperbarui.");
    return { added: !had, ok: true };
  } catch {
    if (state.customerId === customerId) {
      const reverted = new Set(state.ids);
      if (had) reverted.add(productId); else reverted.delete(productId);
      setState({ customerId, ids: reverted });
    }
    return { added: !had, ok: false };
  } finally {
    inFlight--;
    if (inFlight === 0 && reloadAfterToggles && loadingFor !== customerId) { reloadAfterToggles = false; loadingFor = customerId; void load(customerId); }
  }
}

export function useWishlist(customerId: string | null) {
  const snapshot = useSyncExternalStore(subscribe, () => state, () => EMPTY);
  useEffect(() => {
    if (!customerId) return;
    if (state.customerId !== customerId) setState({ customerId, ids: new Set() });
    const fresh = loaded?.customerId === customerId && Date.now() - loaded.at < RELOAD_AFTER_MS;
    if (!fresh && loadingFor !== customerId) { loadingFor = customerId; void load(customerId); }
  }, [customerId]);
  const ids = customerId && snapshot.customerId === customerId ? snapshot.ids : EMPTY.ids;
  return { ids, has: (productId: string) => ids.has(productId), toggle: (productId: string): Promise<WishlistToggleResult> => customerId ? toggle(customerId, productId) : Promise.resolve({ added: false, ok: false }) };
}
