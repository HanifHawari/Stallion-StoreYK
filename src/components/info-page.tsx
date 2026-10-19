import Link from "next/link";
import type { ReactNode } from "react";

export const STORE_CONTACT = {
  whatsapp: "https://wa.me/6282120999926",
  phone: "0821 2099 9926",
  email: "stallionstore@gmail.com",
  address: "Jl. Mangga Jl. Affandi No.109 B, Gejayan, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55583",
  hours: "Setiap hari 14.00–21.00 WIB",
};

// Penanda isi template yang wajib dilengkapi toko sebelum launch (cari "[ISI OLEH CLIENT]").
export function Fill({ children }: { children?: ReactNode }) {
  return <mark className="client-fill">[ISI OLEH CLIENT{children ? <>: {children}</> : null}]</mark>;
}

export function InfoPage({ crumb, eyebrow, title, intro, updated = true, children }: { crumb: string; eyebrow: string; title: string; intro: ReactNode; updated?: boolean; children: ReactNode }) {
  return <>
    <div className="breadcrumb site-container"><Link href="/">HOME</Link><span>/</span><span>{crumb}</span></div>
    <section className="stores-page">
      <div className="site-container stores-page-heading"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p>{intro}</p></div>
      <div className="site-container info-layout">
        <article className="member-panel info-panel">
          <div className="info-panel-body info-content">
            {updated && <p className="info-updated">Terakhir diperbarui: <Fill>tanggal</Fill></p>}
            {children}
          </div>
        </article>
        <aside className="member-panel info-panel info-contact">
          <div className="member-panel-heading"><h2>BUTUH BANTUAN?</h2></div>
          <div className="info-panel-body info-content">
            <p>Tim Stallion Store siap membantu soal ukuran, ketersediaan, dan pesanan.</p>
            <ul>
              <li><a href={STORE_CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp {STORE_CONTACT.phone}</a></li>
              <li><a href={`mailto:${STORE_CONTACT.email}`}>{STORE_CONTACT.email}</a></li>
              <li><Link href="/stores">Stallion Store Jogja</Link> · {STORE_CONTACT.hours}</li>
            </ul>
            <p><Link href="/faq">FAQ</Link> · <Link href="/how-to-order">Cara Belanja</Link> · <Link href="/returns">Pengembalian</Link> · <Link href="/size-guide">Panduan Ukuran</Link></p>
          </div>
        </aside>
      </div>
    </section>
  </>;
}
