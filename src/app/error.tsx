"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return <div className="order-page"><div className="site-container order-card">
    <span className="material-symbols-outlined order-icon">error</span>
    <span className="eyebrow">STALLION STORE / ERROR</span>
    <h1>TERJADI KESALAHAN</h1>
    <p>Halaman belum dapat dimuat. Silakan coba lagi beberapa saat lagi, atau hubungi toko kami jika masalah berlanjut.</p>
    <div className="order-actions">
      <button type="button" className="button button-orange" onClick={() => retry()}>COBA LAGI</button>
      <Link href="/" className="button button-outline-dark">KEMBALI KE BERANDA</Link>
    </div>
    {error.digest && <p><small>Kode: {error.digest}</small></p>}
  </div></div>;
}
