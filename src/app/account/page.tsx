import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { MemberNavigation } from "@/components/member-navigation";
import { OrderCheckDrawer } from "@/components/order-check-drawer";
import { NewsletterSignup } from "@/components/newsletter-signup";

export const dynamic = "force-dynamic";

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const isPreview = process.env.NODE_ENV === "development" && (await searchParams).preview === "1";
  const signedInCustomer = await getCurrentCustomer();
  if (!signedInCustomer && !isPreview) redirect("/login?next=/account");
  const customer = signedInCustomer ?? { id: "preview", name: "Pengunjung", email: "" };
  const orderCount = isPreview ? 0 : (await getPool().query<{ count: number }>(
    "SELECT COUNT(*)::integer AS count FROM orders WHERE customer_id = $1",
    [customer.id],
  )).rows[0]?.count ?? 0;
  const previewSuffix = isPreview ? "?preview=1" : "";
  return <>
    <div className="account-page"><div className="site-container member-container">
      <MemberNavigation active="dashboard" name={customer.name} preview={isPreview} />
      <section className="member-welcome" id="dashboard">
        <div><span className="eyebrow">STALLION STORE MEMBER</span><h1>HALO, {customer.name.toLocaleUpperCase("id-ID")}!</h1><p>Selamat datang kembali. Kelola pesanan dan sepatu favoritmu di sini.</p><div className="member-welcome-actions"><OrderCheckDrawer email={customer.email} preview={isPreview} /><Link className="button button-outline-dark" href="/shoes">JELAJAHI SEPATU <span className="material-symbols-outlined">arrow_forward</span></Link></div></div>
        <div className="member-stat"><small>TOTAL PESANAN</small><strong>{orderCount}</strong><span>di akun ini</span></div>
      </section>
      <div className="member-shortcuts">
        <Link href={"/account/orders" + previewSuffix} className="member-shortcut"><span className="material-symbols-outlined">package_2</span><span><strong>PESANAN SAYA</strong><small>Lihat riwayat dan status pesananmu.</small></span><span className="material-symbols-outlined">arrow_forward</span></Link>
        <Link href={"/account/wishlist" + previewSuffix} className="member-shortcut"><span className="material-symbols-outlined">favorite</span><span><strong>WISHLIST SAYA</strong><small>Buka sepatu yang kamu simpan.</small></span><span className="material-symbols-outlined">arrow_forward</span></Link>
      </div>
      <section className="member-panel member-details"><div className="member-panel-heading"><h2>DETAIL AKUN</h2></div><div><span>Nama</span><strong>{customer.name}</strong></div><div><span>Email</span><strong>{isPreview ? "Belum terhubung" : customer.email}</strong></div>{!isPreview && <form action="/api/auth/logout" method="post"><button className="button button-outline-dark" type="submit">KELUAR AKUN</button></form>}</section>
    </div></div>
    <section className="member-club"><div className="member-club-content"><span className="eyebrow">STALLION STORE COMMUNITY</span><h2>JOIN THE CLUB</h2><p>Dapatkan kabar koleksi terbaru dan pilihan sepatu dari Stallion Store melalui email.</p><NewsletterSignup email={customer.email} /></div></section>
  </>;
}

