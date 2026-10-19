import type { Metadata } from "next";
import Link from "next/link";
import { SizeGuideTabs } from "@/components/size-guide-tabs";
import { MEASURE_STEPS } from "@/lib/size-guide";

export const metadata: Metadata = { title: "Panduan Ukuran", description: "Tabel konversi ukuran sepatu US, UK, EU, dan CM untuk Nike, Jordan, Adidas, HOKA, ASICS, New Balance, Puma, Vans, Converse, dan Under Armour." };

export default async function SizeGuidePage({ searchParams }: { searchParams: Promise<{ brand?: string }> }) {
  const { brand } = await searchParams;
  return <>
    <div className="breadcrumb site-container"><Link href="/">HOME</Link><span>/</span><span>PANDUAN UKURAN</span></div>
    <section className="stores-page">
      <div className="site-container stores-page-heading"><span className="eyebrow">FIND YOUR FIT</span><h1>PANDUAN UKURAN</h1><p>Cocokkan panjang kakimu dengan tabel ukuran tiap brand. Semua sepatu di Stallion Store memakai ukuran EU.</p></div>
      <div className="site-container info-layout">
        <section className="member-panel info-panel">
          <div className="member-panel-heading"><h2>TABEL UKURAN</h2></div>
          <div className="info-panel-body"><SizeGuideTabs initial={typeof brand === "string" ? brand : ""} /></div>
        </section>
        <section className="member-panel info-panel">
          <div className="member-panel-heading"><h2>CARA MENGUKUR KAKI</h2></div>
          <div className="info-panel-body info-content">
            <ol>{MEASURE_STEPS.map((step) => <li key={step}>{step}</li>)}</ol>
            <p>Konversi bersifat panduan umum dan bisa sedikit berbeda per model. Masih ragu? Konsultasikan ukuran lewat <a href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer">WhatsApp toko</a> atau coba langsung di <Link href="/stores">Stallion Store Jogja</Link>.</p>
          </div>
        </section>
      </div>
    </section>
  </>;
}
