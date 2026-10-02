import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import { ScrollCarousel } from "@/components/scroll-carousel";
import type { Product } from "@/lib/catalog";

export function ProductSection({ eyebrow, title, products, href, tone = "plain", id, autoPlay = false }: { eyebrow: string; title: string; products: Product[]; href: string; tone?: "plain" | "soft" | "dark"; id?: string; autoPlay?: boolean }) {
  return (
    <section id={id} className={`product-section section-${tone}`}>
      <div className="site-container">
        <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link href={href} className="text-link">EXPLORE ALL <span className="material-symbols-outlined">arrow_forward</span></Link></div>
        <ScrollCarousel className="product-grid" label={title} autoPlay={autoPlay}>{products.map((product) => <ProductCard key={product.id} product={product} />)}</ScrollCarousel>
      </div>
    </section>
  );
}
