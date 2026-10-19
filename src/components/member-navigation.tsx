import Link from "next/link";

import { ScrollCarousel } from "@/components/scroll-carousel";

export function MemberNavigation({ active, name, preview }: { active: "dashboard" | "orders" | "wishlist" | "addresses" | "settings"; name: string; preview: boolean }) {
  const suffix = preview ? "?preview=1" : "";
  return <>
    {preview && <div className="member-preview-note" role="status"><strong>PRATINJAU TAMPILAN</strong><span>Halaman ini hanya untuk melihat desain di lokal. Login, pesanan, wishlist, dan newsletter baru aktif setelah PostgreSQL dikonfigurasi.</span></div>}
    <nav aria-label="Menu akun"><ScrollCarousel className="member-nav" label="Menu akun">
      <Link className={active === "dashboard" ? "member-nav-active" : ""} href={"/account" + suffix}><span className="material-symbols-outlined">dashboard</span> DASHBOARD</Link>
      <Link className={active === "orders" ? "member-nav-active" : ""} href={"/account/orders" + suffix}><span className="material-symbols-outlined">shopping_bag</span> PESANAN</Link>
      <Link className={active === "wishlist" ? "member-nav-active" : ""} href={"/account/wishlist" + suffix}><span className="material-symbols-outlined">favorite</span> WISHLIST</Link>
      <Link className={active === "addresses" ? "member-nav-active" : ""} href={"/account/addresses" + suffix}><span className="material-symbols-outlined">location_on</span> ALAMAT</Link>
      <Link className={active === "settings" ? "member-nav-active" : ""} href={"/account/settings" + suffix}><span className="material-symbols-outlined">settings</span> PENGATURAN</Link>
      <Link href="/shoes"><span className="material-symbols-outlined">arrow_back</span> BELANJA</Link>
      <span className="member-nav-name">{name}<small>Member Stallion Store</small></span>
    </ScrollCarousel></nav>
  </>;
}
