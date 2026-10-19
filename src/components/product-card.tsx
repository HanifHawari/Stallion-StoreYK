"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/components/auth-provider";
import { showToast } from "@/components/toast";
import { discountPercent, formatRupiah, type Product } from "@/lib/catalog";
import { useWishlist } from "@/lib/use-wishlist";

export function ProductCard({ product }: { product: Product }) {
  const { customer, ensureSignedIn } = useAuth();
  const wishlist = useWishlist(customer?.id ?? null);
  const liked = wishlist.has(product.id);

  function toggleLiked() {
    if (!customer) { ensureSignedIn("wishlist"); return; }
    void wishlist.toggle(product.id).then(({ added, ok }) => {
      if (!ok) showToast({ icon: "error", tone: "error", title: added ? "GAGAL MENYIMPAN" : "GAGAL MENGHAPUS", text: "Wishlist belum berubah. Periksa koneksi lalu coba lagi." });
      else if (added) showToast({ icon: "favorite", title: "DISIMPAN KE WISHLIST", text: product.name, href: "/account/wishlist", linkLabel: "LIHAT WISHLIST" });
    });
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

