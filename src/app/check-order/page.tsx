import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { OrderLookupForm } from "@/components/order-lookup-form";

export const dynamic = "force-dynamic";

export default async function CheckOrderPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const isPreview = process.env.NODE_ENV === "development" && (await searchParams).preview === "1";
  const customer = await getCurrentCustomer();
  if (!customer && !isPreview) redirect("/login?next=/check-order");
  return <div className="check-order-page"><div className="site-container">
    {isPreview && <div className="member-preview-note" role="status"><strong>PRATINJAU TAMPILAN</strong><span>Formulir dapat dilihat, tetapi pencarian pesanan memerlukan login dan PostgreSQL.</span></div>}
    <div className="check-order-heading"><span className="eyebrow">STALLION STORE / MEMBER</span><h1>CHECK YOUR ORDER</h1><p>Masukkan detail pesanan untuk melihat status pembayaran dan pesananmu.</p></div>
    <section className="check-order-card"><OrderLookupForm /><div className="check-order-help"><p>Belum punya nomor pesanan?</p><Link href={isPreview ? "/account/orders?preview=1" : "/account/orders"}>Lihat pesanan di akunmu <span className="material-symbols-outlined">arrow_forward</span></Link><small>Perlu bantuan? <a href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer">Hubungi Stallion Store</a></small></div></section>
    <div className="check-order-support"><div><span className="material-symbols-outlined">package_2</span><strong>STATUS PESANAN</strong><p>Lihat konfirmasi pembayaran yang tercatat.</p></div><div><span className="material-symbols-outlined">mail</span><strong>BANTUAN EMAIL</strong><p><a href="mailto:stallionstore@gmail.com">stallionstore@gmail.com</a></p></div><div><span className="material-symbols-outlined">support_agent</span><strong>HUBUNGI TOKO</strong><p><a href="tel:+6282120999926">0821 2099 9926</a></p></div></div>
  </div></div>;
}


