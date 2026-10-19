"use client";

import "./globals.css";

// Cadangan terakhir jika root layout sendiri gagal (mis. header/footer error). Tidak memakai komponen lain.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <html lang="id"><body>
    <div className="order-page"><div className="site-container order-card">
      <span className="eyebrow">STALLION STORE / ERROR</span>
      <h1>TERJADI KESALAHAN</h1>
      <p>Website belum dapat dimuat. Silakan coba lagi beberapa saat lagi.</p>
      <div className="order-actions">
        <button type="button" className="button button-orange" onClick={() => retry()}>COBA LAGI</button>
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- root layout gagal, pakai navigasi penuh */}
        <a href="/" className="button button-outline-dark">KEMBALI KE BERANDA</a>
      </div>
      {error.digest && <p><small>Kode: {error.digest}</small></p>}
    </div></div>
  </body></html>;
}
