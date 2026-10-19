import type { Metadata } from "next";
import type { Product } from "@/lib/catalog";
import { SITE_NAME, siteUrl } from "@/lib/site";

// Judul unik per produk: nama + merek (bila belum ada di nama) + warna (beberapa model punya banyak warna).
export function productTitle(product: Product): string {
  const name = product.name.toLowerCase().includes(product.brand.toLowerCase()) ? product.name : `${product.brand} ${product.name}`;
  return `${name} — ${product.color}`;
}

function productDescription(product: Product): string {
  const base = product.description.trim() || `${product.name} dari ${product.brand}, kategori ${product.category}.`;
  return base.length > 160 ? base.slice(0, 157).trimEnd() + "…" : base;
}

export function productMetadata(product: Product): Metadata {
  const title = productTitle(product);
  const description = productDescription(product);
  const path = `/shoes/${product.slug}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { type: "website", siteName: SITE_NAME, locale: "id_ID", url: path, title, description, images: [{ url: product.image, alt: `${product.brand} ${product.name}` }] },
    twitter: { card: "summary_large_image", title, description, images: [product.image] },
  };
}

// Data terstruktur schema.org/Product untuk mesin pencari. Foto memakai path yang sudah ada apa adanya.
export function productJsonLd(product: Product): string {
  const base = siteUrl();
  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: productDescription(product),
    image: [product.image, product.hoverImage].filter(Boolean).map((path) => new URL(path as string, base).toString()),
    brand: { "@type": "Brand", name: product.brand },
    color: product.color,
    category: product.category,
  };
  if (product.price) {
    data.offers = {
      "@type": "Offer",
      url: new URL(`/shoes/${product.slug}`, base).toString(),
      priceCurrency: "IDR",
      price: product.price,
      availability: product.sizes.length ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    };
  }
  // "<" di-escape agar teks produk tidak bisa menutup tag <script>.
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
