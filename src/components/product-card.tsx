"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
import { discountPercent, formatRupiah, type Product } from "@/lib/catalog";

export function ProductCard({ product }: { product: Product }) {
  const { customer, ensureSignedIn } = useAuth();
  const [liked, setLiked] = useState(false);
  const wishlistKey = customer ? "stallion-store-wishlist-v1:" + customer.id : null;
  useEffect(() => {
    if (!wishlistKey) return;
    const update = () => {
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(wishlistKey) ?? "[]");
        setLiked(Array.isArray(saved) && saved.includes(product.id));
      } catch { setLiked(false); }
    };
    update();
    window.addEventListener("stallion-wishlist-change", update);
    window.addEventListener("storage", update);
    return () => { window.removeEventListener("stallion-wishlist-change", update); window.removeEventListener("storage", update); };
  }, [product.id, wishlistKey]);

  function toggleLiked() {
    if (!wishlistKey) { ensureSignedIn(); return; }
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(wishlistKey) ?? "[]");
      const list = Array.isArray(saved) ? saved.filter((value): value is string => typeof value === "string") : [];
      const next = list.includes(product.id) ? list.filter((id) => id !== product.id) : [...list, product.id];
      localStorage.setItem(wishlistKey, JSON.stringify(next));
      window.dispatchEvent(new Event("stallion-wishlist-change"));
      setLiked(next.includes(product.id));
    } catch { /* Storage can be unavailable; the card remains usable. */ }
  }

  const discount = discountPercent(product);
  return (
    <article className="product-card">
      <div className="product-visual">
        <Link className={product.hoverImage ? "has-hover-image" : undefined} href={"/shoes/" + product.slug} aria-label={"Lihat " + product.name}>
          <Image className={"product-image product-image-primary" + (product.image.startsWith("/images/products/concept-") ? " product-image-full-frame" : "")} src={product.image} alt={product.brand + " " + product.name} fill sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 20vw" unoptimized={!product.image.startsWith("/")} />
          {product.hoverImage && <Image className="product-image product-image-hover" src={product.hoverImage} alt="" fill sizes="(max-width: 640px) 50vw, (max-width: 1200px) 33vw, 20vw" unoptimized={!product.hoverImage.startsWith("/")} />}
        </Link>
        <div className="product-badges">{discount && <span className="badge badge-discount">-{discount}%</span>}{product.badge && <span className="badge badge-dark">{product.badge}</span>}</div>
        <button className={"wishlist-button " + (liked ? "liked" : "")} aria-label={(liked ? "Hapus " : "Simpan ") + product.name + (liked ? " dari wishlist" : " ke wishlist")} aria-pressed={liked} onClick={toggleLiked}><span className="material-symbols-outlined">favorite</span></button>
      </div>
      <div className="product-content">
        <div className="product-meta"><span>{product.brand}</span><span>·</span><span>{product.category}</span></div>
        <Link href={"/shoes/" + product.slug} className="product-name">{product.name}</Link>
        <div className="product-color">{product.color}</div>
        <div className="size-preview">{product.sizes.slice(0, 4).map((size) => <span key={size}>{size}</span>)}{product.sizes.length > 4 && <span>+{product.sizes.length - 4}</span>}</div>
        <div className="product-bottom"><div className="price-stack"><strong>{product.price ? formatRupiah(product.price) : "Harga menyusul"}</strong>{product.compareAt && <s>{formatRupiah(product.compareAt)}</s>}</div><Link href={"/shoes/" + product.slug} className="quick-add" aria-label={"Pilih ukuran " + product.name}><span className="material-symbols-outlined">add</span></Link></div>
      </div>
    </article>
  );
}

