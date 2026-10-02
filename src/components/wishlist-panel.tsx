"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatRupiah } from "@/lib/catalog";

export function WishlistPanel({ customerId, products, standalone = false }: { customerId: string; products: Product[]; standalone?: boolean }) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const key = "stallion-store-wishlist-v1:" + customerId;
    function update() {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
        setIds(Array.isArray(saved) ? saved.filter((id): id is string => typeof id === "string") : []);
      } catch { setIds([]); }
    }
    update();
    window.addEventListener("storage", update);
    window.addEventListener("stallion-wishlist-change", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("stallion-wishlist-change", update); };
  }, [customerId]);
  const selected = products.filter((product) => ids.includes(product.id));
  return <section className={"member-panel " + (standalone ? "member-full-panel member-wishlist-page" : "")} id="wishlist"><div className="member-panel-heading"><h2>WISHLIST SAYA</h2><Link href="/shoes">LIHAT PRODUK <span className="material-symbols-outlined">arrow_forward</span></Link></div>
    {selected.length ? <div className="member-wishlist">{selected.map((product) => <Link className="member-wish-item" href={"/shoes/" + product.slug} key={product.id}><img src={product.image} alt={product.name} /><span><small>{product.brand.toUpperCase()}</small><strong>{product.name}</strong><b>{product.price === null ? "Harga menyusul" : formatRupiah(product.price)}</b></span><span className="material-symbols-outlined">arrow_forward</span></Link>)}</div> : <div className="member-empty"><span className="material-symbols-outlined">favorite</span><p>Belum ada sepatu favorit.</p><Link className="button button-dark" href="/shoes">JELAJAHI SEPATU</Link></div>}
  </section>;
}

