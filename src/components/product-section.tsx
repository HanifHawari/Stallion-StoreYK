import Link from "next/link";
import { ProductCard } from "@/components/product-card";
import type { Product } from "@/lib/catalog";

export function ProductSection({ eyebrow, title, products, href, tone = "plain", id }: { eyebrow: string; title: string; products: Product[]; href: string; tone?: "plain" | "soft" | "dark"; id?: string }) {
  return (
    <section id={id} className={`product-section section-${tone}`}>
      <div className="site-container">
        <div className="section-heading"><div><span className="eyebrow">{eyebrow}</span><h2>{title}</h2></div><Link href={href} className="text-link">EXPLORE ALL <span className="material-symbols-outlined">arrow_forward</span></Link></div>
        <div className="product-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </div>
    </section>
  );
}
