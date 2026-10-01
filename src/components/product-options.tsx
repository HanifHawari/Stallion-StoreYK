"use client";

import { useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { addToCart } from "@/lib/cart";
import type { Product } from "@/lib/catalog";

export function ProductOptions({ product }: { product: Product }) {
  const [size, setSize] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const { ensureSignedIn } = useAuth();
  function add() {
    if (!size) { setMessage("Pilih ukuran terlebih dahulu."); return; }
    if (!ensureSignedIn()) return;
    if (!addToCart(product, size)) { setMessage("Produk ini belum bisa ditambahkan ke keranjang."); return; }
    setMessage("Sepatu ditambahkan ke keranjang.");
    window.dispatchEvent(new Event("stallion-cart-open"));
  }
  return <div className="product-options"><div className="options-heading"><strong>SELECT SIZE</strong><span>EU SIZE</span></div><div className="product-size-grid">{product.sizes.map((item) => <button className={size === item ? "selected" : ""} onClick={() => { setSize(item); setMessage(""); }} key={item}>{item}</button>)}</div>{!product.sizes.length && <p>Ukuran belum tersedia.</p>}<button className="button button-orange add-cart-button" onClick={add} disabled={!product.price || !product.sizes.length}><span className="material-symbols-outlined">shopping_bag</span> ADD TO BAG</button>{message && <p className="form-message" role="status">{message}</p>}{product.preview && <p className="product-preview-note">Ini produk pratinjau dari desain. Pembayaran akan tersedia setelah katalog asli dimasukkan ke database.</p>}</div>;
}

