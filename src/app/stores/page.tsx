import type { Metadata } from "next";
import Link from "next/link";
import { StoreMap } from "@/components/store-map";

export const metadata: Metadata = { title: "Offline Store Yogyakarta" };

const address = "Jl. Mangga Jl. Affandi No.109 B, Gejayan, Condongcatur, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55583, Indonesia";
const mapsUrl = "https://maps.app.goo.gl/5DHhJnoQsURy2F846";
const directionsUrl = "https://www.google.com/maps/dir/?api=1&destination=-7.7529897%2C110.3972804";
const whatsappUrl = "https://wa.me/6282120999926";

export default function StoresPage() {
  return <>
    <div className="breadcrumb site-container"><Link href="/">HOME</Link><span>/</span><span>OFFLINE STORES</span></div>
    <section className="stores-page">
      <div className="site-container stores-page-heading"><span className="eyebrow">VISIT US IN YOGYAKARTA</span><h1>STALLION STORE JOGJA</h1><p>Lihat lokasi toko, hubungi kami, atau buka petunjuk arah untuk berkunjung langsung.</p></div>
      <div className="site-container store-layout">
        <article className="store-info-card">
          <img className="store-photo" src="/images/stores/stallion-store-jogja.png" alt="Tampak depan Stallion Store di Gejayan, Yogyakarta" />
          <div className="store-info-content">
            <span className="store-location-label">GEJAYAN, SLEMAN</span>
            <h2>STALLION STORE JOGJA</h2>
            <address>{address}</address>
            <div className="store-facts">
              <span><span className="material-symbols-outlined">schedule</span> Buka setiap hari 14.00–21.00 WIB</span>
              <a href="tel:+6282120999926"><span className="material-symbols-outlined">call</span> 0821 2099 9926</a>
              <a href="mailto:stallionstore@gmail.com"><span className="material-symbols-outlined">mail</span> stallionstore@gmail.com</a>
            </div>
            <div className="store-actions">
              <a className="button button-dark" href={directionsUrl} target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">near_me</span> PETUNJUK ARAH</a>
              <a className="button button-outline-dark" href={mapsUrl} target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">map</span> LIHAT DI PETA</a>
              <a className="button button-outline-dark" href={whatsappUrl} target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">chat</span> WHATSAPP TOKO</a>
            </div>
          </div>
        </article>
        <div className="store-map-panel"><StoreMap cartoKey={process.env.NEXT_PUBLIC_CARTO_BASEMAP_KEY ?? ""} /></div>
      </div>
    </section>
  </>;
}


