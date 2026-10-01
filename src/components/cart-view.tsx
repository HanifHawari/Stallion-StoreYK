"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCart, writeCart, type CartItem } from "@/lib/cart";
import { formatRupiah } from "@/lib/catalog";
import { SHIPPING_FEE_IDR } from "@/lib/commerce";
import { useAuth } from "@/components/auth-provider";

export function CartView() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const { ensureSignedIn } = useAuth();
  useEffect(() => { setItems(readCart()); }, []);
  function update(next: CartItem[]) { writeCart(next); setItems(next); }
  if (!items) return <div className="site-container cart-loading">Memuat keranjang...</div>;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <div className="site-container cart-layout"><div className="cart-main"><div className="page-title"><span className="eyebrow">YOUR SELECTION</span><h1>SHOPPING BAG <small>({items.reduce((sum, item) => sum + item.quantity, 0)})</small></h1></div>{items.length ? <div className="cart-items">{items.map((item) => <div className="cart-item" key={item.key}><Link href={`/shoes/${item.slug}`}><img src={item.image} alt={item.name} /></Link><div className="cart-item-info"><span>{item.brand.toUpperCase()}</span><Link href={`/shoes/${item.slug}`}><strong>{item.name}</strong></Link><small>SIZE EU {item.size}</small><b>{formatRupiah(item.price)}</b>{item.preview && <em>PRODUK PRATINJAU</em>}</div><div className="cart-item-controls"><button aria-label={`Hapus ${item.name}`} onClick={() => update(items.filter((other) => other.key !== item.key))}><span className="material-symbols-outlined">delete</span></button><div className="quantity-control"><button aria-label="Kurangi jumlah" onClick={() => update(items.map((other) => other.key === item.key ? { ...other, quantity: Math.max(1, other.quantity - 1) } : other))}>âˆ’</button><span>{item.quantity}</span><button aria-label="Tambah jumlah" onClick={() => update(items.map((other) => other.key === item.key ? { ...other, quantity: Math.min(10, other.quantity + 1) } : other))}>+</button></div></div></div>)}</div> : <div className="cart-empty"><span className="material-symbols-outlined">shopping_bag</span><h2>YOUR BAG IS EMPTY</h2><p>Temukan sepatu yang siap menemani langkahmu berikutnya.</p><Link href="/shoes" className="button button-orange">EXPLORE SHOES</Link></div>}<Link href="/shoes" className="continue-link"><span className="material-symbols-outlined">arrow_back</span> CONTINUE SHOPPING</Link></div>{items.length > 0 && <aside className="summary-card"><h2>ORDER SUMMARY</h2><div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div><span>Shipping</span><strong>{formatRupiah(SHIPPING_FEE_IDR)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatRupiah(subtotal + SHIPPING_FEE_IDR)}</strong></div>{items.some((item) => item.preview) ? <><p className="summary-warning">Produk ini adalah contoh dari ZIP. Checkout baru aktif untuk produk asli yang disimpan di PostgreSQL.</p><button className="button button-dark summary-checkout" disabled>CHECKOUT BELUM AKTIF</button></> : <button className="button button-orange summary-checkout" onClick={() => { if (ensureSignedIn()) window.location.assign("/checkout"); }}>PROCEED TO CHECKOUT <span className="material-symbols-outlined">arrow_forward</span></button>}<p className="summary-secure"><span className="material-symbols-outlined">lock</span> Pembayaran diproses oleh Midtrans</p></aside>}</div>;
}

