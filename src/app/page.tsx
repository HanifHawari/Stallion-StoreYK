import Link from "next/link";
import { HeroCarousel } from "@/components/hero-carousel";
import { ProductSection } from "@/components/product-section";
import { ProductCard } from "@/components/product-card";
import { BrandMarquee } from "@/components/brand-marquee";
import { getProducts } from "@/lib/db";
import { discountPercent } from "@/lib/catalog";

const announcements = [
  "THE NEXT STEP STARTS HERE",
  "INTERNATIONAL FOOTWEAR SELECTION",
  "RUN / COURT / EVERYDAY",
  "STALLION STORE",
];

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const products = await getProducts();
  const newArrivals = products.slice(0, 5);
  const trending = [...products.filter((item) => item.brand === "HOKA"), ...products.filter((item) => item.brand !== "HOKA")].slice(0, 5);
  const sale = products.filter((item) => discountPercent(item) !== null).slice(0, 5);
  const topSales = [...products].filter((item) => item.price !== null).sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0)).slice(0, 3);
  const courtEdit = products.filter((product) => product.category === "Basketball").slice(0, 3);

  return <>
    <HeroCarousel />
    <div className="announcement" aria-label="Informasi Stallion Store"><div className="announcement-track">{[0, 1].map((copy) => <div className="announcement-group" key={copy} aria-hidden={copy === 1}>{announcements.map((item) => <span key={item}>{item}</span>)}</div>)}</div></div>
    <ProductSection id="new-arrivals" eyebrow="FRESH FROM THE STARTING LINE" title="NEW ARRIVALS" products={newArrivals} href="/shoes" />
    <ProductSection eyebrow="WHAT EVERYONE IS WATCHING" title="TRENDING NOW" products={trending} href="/shoes" tone="soft" />
    <section className="top-sales"><div className="site-container top-sales-grid"><div><span className="eyebrow">DON'T MISS OUT</span><h2>TOP SALES</h2><div className="product-grid ranked-grid">{topSales.map((product) => <ProductCard key={product.id} product={product} />)}</div></div><div><span className="eyebrow">BUILT FOR YOUR GAME</span><h2>THE COURT EDIT</h2><div className="product-grid ranked-grid">{courtEdit.map((product) => <ProductCard key={product.id} product={product} />)}</div></div></div></section>
    <ProductSection eyebrow="THE BIGGEST PRICE DROPS" title="FINAL CALL: SALE & CLEARANCE" products={sale} href="/sale" tone="dark" />
    <section className="shop-sport"><div className="site-container"><div className="section-heading"><div><span className="eyebrow">CHOOSE YOUR MOVEMENT</span><h2>SHOP BY SPORT</h2></div><Link href="/shoes" className="text-link">ALL SHOES <span className="material-symbols-outlined">arrow_forward</span></Link></div><div className="sport-grid"><Link className="sport-card sport-running" href="/running"><img src={products.find((p) => p.brand === "HOKA")?.image ?? products[0]?.image} alt="Sepatu running" /><span><small>EVERY MILE MATTERS</small><strong>RUNNING</strong><em>EXPLORE <span className="material-symbols-outlined">arrow_forward</span></em></span></Link><Link className="sport-card sport-basketball" href="/basketball"><img src={products.find((p) => p.category === "Basketball")?.image ?? products[0]?.image} alt="Sepatu basketball" /><span><small>OWN THE COURT</small><strong>BASKETBALL</strong><em>EXPLORE <span className="material-symbols-outlined">arrow_forward</span></em></span></Link><Link className="sport-card sport-lifestyle" href="/shoes"><img src={products.find((p) => p.brand === "Adidas")?.image ?? products[0]?.image} alt="Sepatu lifestyle" /><span><small>EVERYDAY ICONS</small><strong>ALL SHOES</strong><em>EXPLORE <span className="material-symbols-outlined">arrow_forward</span></em></span></Link></div></div></section>
    <BrandMarquee />
    <section className="closing-cta"><div className="site-container closing-inner"><span className="eyebrow">YOUR NEXT PAIR IS WAITING</span><h2>FIND YOUR<br /><em>FORWARD.</em></h2><p>Sepatu tepat mengubah setiap langkah. Mulai dari sini.</p><Link href="/shoes" className="button button-orange">EXPLORE ALL SHOES <span className="material-symbols-outlined">arrow_forward</span></Link></div></section>
  </>;
}


