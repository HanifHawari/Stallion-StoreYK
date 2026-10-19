"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { openDevelopmentAnnouncement } from "@/components/development-announcement";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatRupiah } from "@/lib/catalog";
import { DEV_MODE } from "@/lib/flags";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const { ensureSignedIn } = useAuth();
  useEffect(() => {
    const update = () => setItems(readCart());
    update();
    window.addEventListener("stallion-cart-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("stallion-cart-change", update); window.removeEventListener("storage", update); };
  }, []);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => { document.body.style.overflow = prior; window.removeEventListener("keydown", escape); };
  }, [open, onClose]);
  if (!open) return null;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  function update(next: CartItem[]) { if (writeCart(next)) setItems(next); }
  function checkout() {
    onClose();
    if (!ensureSignedIn("checkout")) return;
    // DEV_MODE: belanja online belum dibuka — popup hanya untuk member yang sudah login.
    // Dibuka setelah drawer tertutup agar kunci scroll drawer sudah dilepas.
    if (DEV_MODE) { window.setTimeout(openDevelopmentAnnouncement, 0); return; }
    window.location.assign("/checkout");
  }
  return <div className="cart-drawer-backdrop" onMouseDown={onClose}>
    <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Shopping bag" onMouseDown={(event) => event.stopPropagation()}>
      <div className="cart-drawer-heading"><h2>SHOPPING BAG <small>{items.reduce((sum, item) => sum + item.quantity, 0)}</small></h2><button aria-label="Tutup keranjang" onClick={onClose}><span className="material-symbols-outlined">close</span></button></div>
      <div className="cart-drawer-shipping"><span className="material-symbols-outlined">local_shipping</span> Ongkir dihitung saat checkout.</div>
      {items.length ? <>
        <div className="cart-drawer-list">{items.map((item) => <div className="cart-drawer-item" key={item.key}><Link href={"/shoes/" + item.slug} onClick={onClose}><img src={item.image} alt={item.name} /></Link><div><small>{item.brand.toUpperCase()} · EU {item.size}</small><Link href={"/shoes/" + item.slug} onClick={onClose}><strong>{item.name}</strong></Link><b>{formatRupiah(item.price)}</b><div className="drawer-quantity"><button aria-label={"Kurangi " + item.name} onClick={() => update(items.map((other) => other.key === item.key ? { ...other, quantity: Math.max(1, other.quantity - 1) } : other))}>−</button><span>{item.quantity}</span><button aria-label={"Tambah " + item.name} onClick={() => update(items.map((other) => other.key === item.key ? { ...other, quantity: Math.min(10, other.quantity + 1) } : other))}>+</button></div></div><button className="cart-drawer-remove" aria-label={"Hapus " + item.name} onClick={() => update(items.filter((other) => other.key !== item.key))}><span className="material-symbols-outlined">delete</span></button></div>)}</div>
        <div className="cart-drawer-footer"><div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div>{items.some((item) => item.preview) ? <><p className="summary-warning">Produk pratinjau belum tersedia untuk checkout.</p><button className="button button-dark" disabled>CHECKOUT BELUM AKTIF</button></> : <button className="button button-dark" onClick={checkout}>PROCEED TO CHECKOUT <span className="material-symbols-outlined">arrow_forward</span></button>}<Link href="/cart" onClick={onClose}>LIHAT HALAMAN KERANJANG</Link></div>
      </> : <div className="cart-drawer-empty"><span className="material-symbols-outlined">shopping_bag</span><h3>YOUR BAG IS EMPTY</h3><p>Belum ada sepatu di keranjangmu. Jelajahi koleksi Stallion Store.</p><Link href="/shoes" className="button button-dark" onClick={onClose}>EXPLORE CATALOG <span className="material-symbols-outlined">arrow_forward</span></Link></div>}
    </aside>
  </div>;
}

