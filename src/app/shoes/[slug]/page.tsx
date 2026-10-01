import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductOptions } from "@/components/product-options";
import { ProductSection } from "@/components/product-section";
import { discountPercent, formatRupiah } from "@/lib/catalog";
import { getProductBySlug, getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, products] = await Promise.all([getProductBySlug(slug), getProducts()]);
  if (!product) notFound();
  const related = products.filter((item) => item.id !== product.id && (item.category === product.category || item.brand === product.brand)).slice(0, 5);
  const discount = discountPercent(product);
  return <><div className="breadcrumb site-container"><Link href="/">HOME</Link><span>/</span><Link href="/shoes">SHOES</Link><span>/</span><span>{product.name}</span></div><section className="product-detail"><div className="site-container detail-grid"><div className="detail-photo"><div className="detail-badge">{product.badge ?? "GLOBAL FOOTWEAR"}</div><img src={product.image} alt={`${product.brand} ${product.name}`} /></div><div className="detail-info"><span className="eyebrow">{product.brand.toUpperCase()} / {product.category.toUpperCase()}</span><h1>{product.name}</h1><p className="detail-color">COLORWAY: {product.color.toUpperCase()}</p><div className="detail-price"><strong>{product.price ? formatRupiah(product.price) : "Harga menyusul"}</strong>{product.compareAt && <s>{formatRupiah(product.compareAt)}</s>}{discount && <span>-{discount}%</span>}</div><p className="detail-description">{product.description}</p><ProductOptions product={product} /><div className="detail-perks"><span><span className="material-symbols-outlined">local_shipping</span> Ongkir tetap Rp25.000</span><span><span className="material-symbols-outlined">lock</span> Checkout Midtrans</span></div></div></div></section>{related.length > 0 && <ProductSection eyebrow="KEEP EXPLORING" title="YOU MAY ALSO LIKE" products={related} href="/shoes" tone="soft" />}</>;
}
