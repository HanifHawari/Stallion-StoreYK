import Link from "next/link";

const brands = [
  { name: "Nike", slug: "nike", logo: "nike" },
  { name: "Jordan", slug: "jordan", logo: "jordan" },
  { name: "Under Armour", slug: "under-armour", logo: "underarmour" },
  { name: "Adidas", slug: "adidas", logo: "adidas" },
  { name: "HOKA", slug: "hoka", logo: "hoka" },
  { name: "New Balance", slug: "new-balance", logo: "newbalance" },
  { name: "Puma", slug: "puma", logo: "puma" },
  { name: "Vans", slug: "vans", logo: "vans" },
  { name: "Converse", slug: "converse", logo: "converse" },
  { name: "ASICS", slug: "asics", logo: "asics" },
];

export function BrandMarquee() {
  return <section className="brand-section"><div className="site-container"><div className="section-heading"><div><span className="eyebrow">THE NAMES THAT MOVE US</span><h2>GLOBAL BRANDS</h2></div></div></div>
    <div className="brand-marquee"><div className="brand-track">{[0, 1].map((copy) => <div className="brand-group" aria-hidden={copy === 1} key={copy}>{brands.map((brand) => <Link href={"/brands/" + brand.slug} tabIndex={copy === 1 ? -1 : undefined} key={brand.slug} aria-label={"Lihat koleksi " + brand.name}><img src={"/images/brands/" + brand.logo + ".svg"} alt={brand.name} /></Link>)}</div>)}</div></div>
  </section>;
}

