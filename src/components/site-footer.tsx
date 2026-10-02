import Link from "next/link";

import { FooterAccountAnnouncement } from "@/components/development-announcement";

export function SiteFooter() {
  return <footer className="site-footer">
    <div className="site-container footer-grid">
      <div className="footer-about"><Link className="footer-brand" href="/"><img src="/images/logo/logo.png" alt="" /><span>STALLION<strong>STORE</strong></span></Link><p>Kurasi sepatu internasional untuk setiap langkah, dari lintasan lari hingga lapangan basket.</p></div>
      <div><h3>BELANJA</h3><Link href="/shoes">Semua Sepatu</Link><Link href="/basketball">Basketball</Link><Link href="/running">Running</Link><Link href="/sale">Sale</Link></div>
      <div><h3>BANTUAN</h3><Link href="/cart">Keranjang</Link><FooterAccountAnnouncement /><Link href="/check-order">Cek Pesanan</Link><Link href="/stores">Lokasi Toko</Link><a href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer">Hubungi Kami</a></div>
      <div><h3>OFFLINE STORE</h3><Link href="/stores">Stallion Store Jogja</Link><p>Jl. Mangga Jl. Affandi No.109 B, Gejayan, Sleman, Yogyakarta 55583</p><p>Buka setiap hari<br />14.00–21.00 WIB</p></div>
      <div><h3>KONTAK</h3><a href="tel:+6282120999926"><span className="material-symbols-outlined">call</span> 0821 2099 9926</a><a href="mailto:stallionstore@gmail.com"><span className="material-symbols-outlined">mail</span> stallionstore@gmail.com</a><Link href="/stores"><span className="material-symbols-outlined">location_on</span> Petunjuk Arah</Link></div>
    </div>
    <div className="site-container footer-bottom"><span>© {new Date().getFullYear()} Stallion Store</span><span>INTERNATIONAL FOOTWEAR · YOGYAKARTA</span></div>
  </footer>;
}




