"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/product-card";
import { discountPercent, formatRupiah, type Product } from "@/lib/catalog";

type CatalogViewProps = {
  products: Product[];
  mode: "all" | "sale" | "basketball" | "running" | "brand";
  brand?: string;
  initialQuery?: string;
};

const allCategories = ["All Shoes", "Basketball", "Running", "Lifestyle"];

export function CatalogView({ products, mode, brand, initialQuery = "" }: CatalogViewProps) {
  const [category, setCategory] = useState(mode === "basketball" ? "Basketball" : mode === "running" ? "Running" : "All Shoes");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [sort, setSort] = useState("featured");
  const [query, setQuery] = useState(initialQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);

  const brands = [...new Set(products.map((item) => item.brand))].sort();
  const sizes = [...new Set(products.flatMap((item) => item.sizes))].sort((a, b) => Number(a) - Number(b));
  const maxAvailablePrice = Math.max(3000000, ...products.map((item) => item.price ?? 0));
  const filtered = useMemo(() => {
    const result = products.filter((item) => {
      if (mode === "sale" && !discountPercent(item)) return false;
      if (mode === "basketball" && item.category !== "Basketball") return false;
      if (mode === "running" && item.category !== "Running") return false;
      if (mode === "brand" && item.brand.toLowerCase().replaceAll(" ", "-") !== brand) return false;
      if (category !== "All Shoes" && item.category !== category) return false;
      if (selectedBrands.length && !selectedBrands.includes(item.brand)) return false;
      if (selectedSizes.length && !selectedSizes.some((size) => item.sizes.includes(size))) return false;
      if (maxPrice !== null && (item.price === null || item.price > maxPrice)) return false;
      if (query && !`${item.name} ${item.brand} ${item.category} ${item.color}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    if (sort === "price-low") result.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    if (sort === "price-high") result.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
    if (sort === "discount") result.sort((a, b) => (discountPercent(b) ?? 0) - (discountPercent(a) ?? 0));
    return result;
  }, [products, mode, brand, category, selectedBrands, selectedSizes, maxPrice, query, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / 12));
  const shown = filtered.slice((page - 1) * 12, page * 12);
  function toggle(list: string[], value: string, setter: (next: string[]) => void) {
    setter(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
    setPage(1);
  }
  function clearFilters() { setCategory(mode === "basketball" ? "Basketball" : mode === "running" ? "Running" : "All Shoes"); setSelectedBrands([]); setSelectedSizes([]); setMaxPrice(null); setQuery(""); setPage(1); }

  const title = mode === "sale" ? "SEASON CLEARANCE" : mode === "basketball" ? "BASKETBALL SHOES" : mode === "running" ? "RUNNING SHOES" : mode === "brand" ? `${brand?.replaceAll("-", " ") ?? "BRAND"} SHOES` : "ALL SHOES";
  return <>
    <div className="breadcrumb site-container"><Link href="/">HOME</Link><span>/</span><span>{title}</span></div>
    <section className={`catalog-hero catalog-hero-${mode}`}><div className="site-container catalog-hero-inner"><div><span className="eyebrow">STALLION STORE / GLOBAL FOOTWEAR</span><h1>{mode === "sale" ? <>SEASON <em>CLEARANCE</em></> : mode === "basketball" ? <>OWN THE <em>COURT.</em></> : mode === "running" ? <>FIND YOUR <em>PACE.</em></> : mode === "brand" ? <>{brand?.replaceAll("-", " ").toUpperCase()} <em>EDIT.</em></> : <>EVERY SHOE. <em>EVERY MOVE.</em></>}</h1><p>{mode === "sale" ? "Pilihan sepatu dari koleksi diskon. Temukan langkah berikutnya dengan harga terbaik." : mode === "basketball" ? "Sepatu basket pilihan untuk kecepatan, kontrol, dan keyakinan di lapangan." : mode === "running" ? "Dari easy run sampai race day, temukan sepatu yang mengikuti ritmemu." : mode === "brand" ? "Koleksi pilihan dari brand global favoritmu." : "Jelajahi sepatu internasional untuk running, basketball, dan keseharian."}</p><div className="hero-chips"><span>GLOBAL BRANDS</span><span>SIZE SELECTION</span><span>SECURE CHECKOUT</span></div></div><div className="catalog-hero-art"><span>SS / 26</span></div></div></section>
    <div className="catalog-shell"><div className="site-container">
      <div className="category-pills">{allCategories.map((item) => <button className={category === item ? "selected" : ""} key={item} onClick={() => { setCategory(item); setPage(1); }}>{item}</button>)}</div>
      <div className="catalog-toolbar"><div><button className="filter-toggle" onClick={() => setFiltersOpen(!filtersOpen)}><span className="material-symbols-outlined">tune</span> FILTERS {(selectedBrands.length + selectedSizes.length + (maxPrice !== null ? 1 : 0)) > 0 && <b>{selectedBrands.length + selectedSizes.length + (maxPrice !== null ? 1 : 0)}</b>}</button><span className="results-count">{filtered.length} PRODUCTS</span></div><div className="toolbar-right"><label className="catalog-search"><span className="material-symbols-outlined">search</span><input aria-label="Cari produk" placeholder="Cari sepatu..." value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><label className="sort-label">SORT <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="featured">Featured</option><option value="price-low">Price: low to high</option><option value="price-high">Price: high to low</option><option value="discount">Biggest discount</option></select></label></div></div>
      <div className={`catalog-layout ${filtersOpen ? "filters-open" : ""}`}><aside className="filters-panel"><div className="filter-heading"><h2>FILTERS</h2><button onClick={clearFilters}>RESET ALL</button></div><div className="filter-group"><h3>CATEGORY</h3>{allCategories.slice(1).map((item) => <label key={item}><input type="checkbox" checked={category === item} onChange={() => { setCategory(category === item ? "All Shoes" : item); setPage(1); }} />{item}</label>)}</div><div className="filter-group"><h3>BRANDS</h3>{brands.map((item) => <label key={item}><input type="checkbox" checked={selectedBrands.includes(item)} onChange={() => toggle(selectedBrands, item, setSelectedBrands)} />{item}</label>)}</div><div className="filter-group"><h3>AVAILABLE SIZES <small>EU</small></h3><div className="filter-sizes">{sizes.map((size) => <button className={selectedSizes.includes(size) ? "selected" : ""} key={size} onClick={() => toggle(selectedSizes, size, setSelectedSizes)}>{size}</button>)}</div></div><div className="filter-group"><h3>PRICE RANGE</h3><input className="price-slider" type="range" min="0" max={maxAvailablePrice} step="100000" value={maxPrice ?? maxAvailablePrice} onChange={(event) => { setMaxPrice(Number(event.target.value) >= maxAvailablePrice ? null : Number(event.target.value)); setPage(1); }} /><div className="price-range-label"><span>Rp 0</span><span>{formatRupiah(maxPrice ?? maxAvailablePrice)}</span></div></div><div className="filter-help"><span className="material-symbols-outlined">info</span><strong>BUTUH BANTUAN UKURAN?</strong><p>Periksa ukuran pada detail produk sebelum menambahkan sepatu ke keranjang.</p></div></aside>
      <div className="catalog-results">{shown.length ? <div className="catalog-grid">{shown.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <div className="empty-state"><span className="material-symbols-outlined">search_off</span><h2>TIDAK ADA PRODUK</h2><p>Ubah filter atau kata kunci untuk menemukan sepatu lain.</p><button className="button button-dark" onClick={clearFilters}>RESET FILTER</button></div>}<div className="pagination"><span>Menampilkan {shown.length ? (page - 1) * 12 + 1 : 0}â€“{Math.min(page * 12, filtered.length)} dari {filtered.length} produk</span><div>{Array.from({ length: totalPages }, (_, index) => <button key={index} className={page === index + 1 ? "active" : ""} onClick={() => { setPage(index + 1); window.scrollTo({ top: 300, behavior: "smooth" }); }}>{index + 1}</button>)}</div></div></div></div>
    </div></div>
  </>;
}

