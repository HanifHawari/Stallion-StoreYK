import Link from "next/link";

export function MemberNavigation({ active, name, preview }: { active: "dashboard" | "orders" | "wishlist"; name: string; preview: boolean }) {
  const suffix = preview ? "?preview=1" : "";
  return <>
    {preview && <div className="member-preview-note" role="status"><strong>PRATINJAU TAMPILAN</strong><span>Halaman ini hanya untuk melihat desain di lokal. Login, pesanan, wishlist, dan newsletter baru aktif setelah PostgreSQL dikonfigurasi.</span></div>}
    <nav className="member-nav" aria-label="Menu akun">
      <Link className={active === "dashboard" ? "member-nav-active" : ""} href={"/account" + suffix}><span className="material-symbols-outlined">dashboard</span> DASHBOARD</Link>
      <Link className={active === "orders" ? "member-nav-active" : ""} href={"/account/orders" + suffix}><span className="material-symbols-outlined">shopping_bag</span> PESANAN</Link>
      <Link className={active === "wishlist" ? "member-nav-active" : ""} href={"/account/wishlist" + suffix}><span className="material-symbols-outlined">favorite</span> WISHLIST</Link>
      <Link href="/shoes"><span className="material-symbols-outlined">arrow_back</span> BELANJA</Link>
      <span className="member-nav-name">{name}<small>Member Stallion Store</small></span>
    </nav>
  </>;
}
