"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, type MouseEvent, useEffect, useState } from "react";
import { CartDrawer } from "@/components/cart-drawer";
import { useAuth } from "@/components/auth-provider";
import { readCart } from "@/lib/cart";

const sportLinks = [
  { href: "/basketball", label: "BASKETBALL" },
  { href: "/running", label: "RUNNING" },
];
const brandLinks = [
  { href: "/brands/nike", label: "NIKE" },
  { href: "/brands/jordan", label: "JORDAN" },
  { href: "/brands/under-armour", label: "UNDER ARMOUR" },
  { href: "/brands/adidas", label: "ADIDAS" },
  { href: "/brands/hoka", label: "HOKA" },
  { href: "/brands/new-balance", label: "NEW BALANCE" },
  { href: "/brands/puma", label: "PUMA" },
  { href: "/brands/vans", label: "VANS" },
  { href: "/brands/converse", label: "CONVERSE" },
  { href: "/brands/asics", label: "ASICS" },
];

function openOnHover(event: MouseEvent<HTMLDetailsElement>) {
  if (window.matchMedia("(hover: hover) and (min-width: 1101px)").matches) event.currentTarget.open = true;
}
function closeOnHover(event: MouseEvent<HTMLDetailsElement>) {
  if (window.matchMedia("(hover: hover) and (min-width: 1101px)").matches) event.currentTarget.open = false;
}

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { customer } = useAuth();
  const [count, setCount] = useState(0);
  const [query, setQuery] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    const update = () => setCount(readCart().reduce((sum, item) => sum + item.quantity, 0));
    const open = () => setCartOpen(true);
    update();
    window.addEventListener("stallion-cart-change", update);
    window.addEventListener("stallion-cart-open", open);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("stallion-cart-change", update);
      window.removeEventListener("stallion-cart-open", open);
      window.removeEventListener("storage", update);
    };
  }, []);
  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") { setMenuOpen(false); setSearchOpen(false); }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push("/shoes?q=" + encodeURIComponent(query.trim()));
    closeMenu();
    setSearchOpen(false);
  }
  function closeMenu() {
    setMenuOpen(false);
    document.querySelectorAll("details.nav-dropdown").forEach((item) => { if (item instanceof HTMLDetailsElement) item.open = false; });
  }
  return <>
    <header className="site-header"><div className="site-container header-inner">
      <div className="header-leading">
        <button type="button" className="menu-toggle" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-controls="main-menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setSearchOpen(false); }}><span className="material-symbols-outlined">{menuOpen ? "close" : "menu"}</span></button>
        <Link className="profile-link" href={customer ? "/account" : "/login?next=/account"} aria-label={customer ? "Profil saya" : "Login"} onClick={closeMenu}><img src="/images/logo/profil.png" alt="" /></Link>
      </div>
      <Link className="wordmark" href="/" aria-label="Stallion Store home" onClick={closeMenu}><span className="wordmark-name">STALLION<span>STORE</span></span></Link>
      <nav id="main-menu" className={"main-nav " + (menuOpen ? "is-open" : "")} aria-label="Navigasi utama">
        <Link className={"nav-sale " + (pathname === "/sale" ? "active" : "")} href="/sale" onClick={closeMenu}>SALE</Link>
        <Link href="/#new-arrivals" onClick={closeMenu}>NEW ARRIVALS</Link>
        <details className="nav-dropdown" onMouseEnter={openOnHover} onMouseLeave={closeOnHover}><summary className={pathname === "/basketball" || pathname === "/running" ? "active" : ""}>BY SPORT <span className="material-symbols-outlined">expand_more</span></summary><div className="nav-dropdown-panel nav-list-panel">{sportLinks.map((link) => <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}</div></details>
        <Link className={pathname === "/shoes" ? "active" : ""} href="/shoes" onClick={closeMenu}>EXPLORE ALL</Link>
        <details className="nav-dropdown" onMouseEnter={openOnHover} onMouseLeave={closeOnHover}><summary className={pathname.startsWith("/brands/") ? "active" : ""}>BY BRAND <span className="material-symbols-outlined">expand_more</span></summary><div className="nav-dropdown-panel nav-list-panel">{brandLinks.map((link) => <Link href={link.href} key={link.href} onClick={closeMenu}>{link.label}</Link>)}</div></details>
        <Link className={pathname === "/stores" ? "active" : ""} href="/stores" onClick={closeMenu}>OFFLINE STORES</Link>
      </nav>
      <div className="header-actions">
        <form className="header-search header-desktop-only" onSubmit={submitSearch} role="search"><span className="material-symbols-outlined">search</span><input aria-label="Cari sepatu atau brand" placeholder="Search shoes, brands..." value={query} onChange={(event) => setQuery(event.target.value)} /></form>
        <Link className="profile-link header-desktop-only" href={customer ? "/account" : "/login?next=/account"} aria-label={customer ? "Profil saya" : "Login"} onClick={closeMenu}><img src="/images/logo/profil.png" alt="" /></Link>
        <button type="button" className="search-toggle" aria-label={searchOpen ? "Tutup pencarian" : "Buka pencarian"} aria-controls="header-search" aria-expanded={searchOpen} onClick={() => { setSearchOpen(!searchOpen); closeMenu(); }}><span className="material-symbols-outlined">{searchOpen ? "close" : "search"}</span></button>
        <button type="button" className="cart-link" onClick={() => { setCartOpen(true); closeMenu(); setSearchOpen(false); }} aria-label={"Keranjang, " + count + " produk"}><img src="/images/logo/cart.png" alt="" />{count > 0 && <span className="cart-count">{count}</span>}</button>
      </div>
      {searchOpen && <form id="header-search" className="header-search header-search-mobile" onSubmit={submitSearch} role="search"><input autoFocus aria-label="Cari sepatu atau brand" placeholder="Search shoes, brands..." value={query} onChange={(event) => setQuery(event.target.value)} /><button type="submit" aria-label="Cari"><span className="material-symbols-outlined">search</span></button></form>}
    </div></header>
    <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
  </>;
}

