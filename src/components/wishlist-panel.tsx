"use client";

import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/catalog";
import { formatRupiah } from "@/lib/catalog";
import { useWishlist } from "@/lib/use-wishlist";

export function WishlistPanel({ products, standalone = false }: { products: Product[]; standalone?: boolean }) {
  const { customer } = useAuth();
  const { ids } = useWishlist(customer?.id ?? null);
  const byId = new Map(products.map((product) => [product.id, product]));
  // Urutan wishlist: terbaru disimpan tampil paling atas.
  const selected = [...ids].map((id) => byId.get(id)).filter((product): product is Product => Boolean(product));
  return <section className={"member-panel " + (standalone ? "member-full-panel member-wishlist-page" : "")} id="wishlist"><div className="member-panel-heading"><h2>WISHLIST SAYA</h2><Link href="/shoes">LIHAT PRODUK <span className="material-symbols-outlined">arrow_forward</span></Link></div>
    {/* HP: daftar ringkas (seluruh baris bisa diklik). Desktop: kartu produk seperti di halaman utama. */}
    {selected.length ? <><div className="member-wishlist">{selected.map((product) => <Link className="member-wish-item" href={"/shoes/" + product.slug} key={product.id}><img src={product.image} alt={product.name} /><span><small>{product.brand.toUpperCase()}</small><strong>{product.name}</strong><b>{product.price === null ? "Harga menyusul" : formatRupiah(product.price)}</b></span></Link>)}</div>{standalone && <div className="member-wishlist-cards">{selected.map((product) => <ProductCard product={product} key={product.id} />)}</div>}</> : <div className="member-empty"><span className="material-symbols-outlined">favorite</span><p>Belum ada sepatu favorit.</p><Link className="button button-dark" href="/shoes">JELAJAHI SEPATU</Link></div>}
  </section>;
}

