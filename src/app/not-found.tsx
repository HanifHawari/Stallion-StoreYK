import Link from "next/link";

export default function NotFound() {
  return <div className="order-page"><div className="site-container order-card">
    <span className="material-symbols-outlined order-icon">search_off</span>
    <span className="eyebrow">STALLION STORE / 404</span>
    <h1>HALAMAN TIDAK DITEMUKAN</h1>
    <p>Halaman yang kamu cari tidak ada atau sudah dipindahkan. Coba jelajahi koleksi sepatu kami.</p>
    <div className="order-actions">
      <Link href="/shoes" className="button button-orange">EXPLORE SHOES <span className="material-symbols-outlined">arrow_forward</span></Link>
      <Link href="/" className="button button-outline-dark">KEMBALI KE BERANDA</Link>
    </div>
  </div></div>;
}
