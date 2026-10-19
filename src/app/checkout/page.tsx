import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckoutView } from "@/components/checkout-view";
import { getCurrentCustomer } from "@/lib/auth";
import { DEV_MODE } from "@/lib/flags";
import { isShippingConfigured } from "@/lib/shipping";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const customer = await getCurrentCustomer();
  if (!customer) redirect("/login?next=/checkout");
  // DEV_MODE: belanja online belum dibuka. Popup pengembangan (hanya untuk member yang login) terbuka otomatis
  // di halaman ini — lihat development-announcement.tsx.
  if (DEV_MODE) return <div className="checkout-page"><div className="site-container checkout-layout"><div className="checkout-main"><div className="page-title"><span className="eyebrow">THE FINAL STEP</span><h1>CHECKOUT</h1></div><div className="cart-empty"><span className="material-symbols-outlined">construction</span><h2>CHECKOUT BELUM TERSEDIA</h2><p>Belanja online Stallion Store sedang kami siapkan. Untuk memesan sekarang, hubungi toko kami lewat WhatsApp.</p><Link href="/cart" className="button button-orange">KEMBALI KE KERANJANG</Link></div></div></div></div>;
  return <div className="checkout-page"><CheckoutView shippingEnabled={isShippingConfigured()} /></div>;
}


