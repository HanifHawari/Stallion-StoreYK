"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Selama DEV_MODE akun (daftar/login) sudah dibuka, tetapi belanja belum: tombol checkout memanggil ini.
export function openDevelopmentAnnouncement(): void {
  window.dispatchEvent(new Event("stallion-development-announcement"));
}

export function DevelopmentAnnouncement() {
  const pathname = usePathname();
  const dialog = useRef<HTMLDialogElement>(null);
  const priorOverflow = useRef<string | null>(null);

  function restoreScroll() {
    if (priorOverflow.current === null) return;
    document.body.style.overflow = priorOverflow.current;
    priorOverflow.current = null;
  }

  useEffect(() => {
    const element = dialog.current;
    function openAnnouncement() {
      if (!element || element.open) return;
      priorOverflow.current = document.body.style.overflow;
      element.showModal();
      document.body.style.overflow = "hidden";
    }
    window.addEventListener("stallion-development-announcement", openAnnouncement);
    if (pathname === "/checkout") openAnnouncement();
    return () => {
      window.removeEventListener("stallion-development-announcement", openAnnouncement);
      element?.close();
      restoreScroll();
    };
  }, [pathname]);

  return <>
    <dialog ref={dialog} className="development-dialog" aria-labelledby="development-dialog-title" aria-describedby="development-dialog-description" onClose={() => { if (!dialog.current?.open) restoreScroll(); }} onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
    }}>
      <div className="development-dialog-content">
        <button type="button" className="development-dialog-close" aria-label="Tutup pengumuman" onClick={() => dialog.current?.close()}><span className="material-symbols-outlined">close</span></button>
        <div className="development-dialog-heading"><span className="material-symbols-outlined">construction</span><div><span className="eyebrow">PENGUMUMAN STALLION STORE</span><h2 id="development-dialog-title">WEBSITE DALAM PENGEMBANGAN</h2></div></div>
        <p id="development-dialog-description">Kami sedang menyiapkan layanan belanja online Stallion Store. Untuk konsultasi ukuran, ketersediaan produk, dan belanja, hubungi toko kami di Gejayan.</p>
        <div className="development-dialog-store"><strong>STALLION STORE JOGJA</strong><p>Gejayan, Sleman, Yogyakarta</p><span>Setiap hari · 14.00–21.00 WIB</span></div>
        <a className="button button-orange" href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">chat</span> HUBUNGI VIA WHATSAPP</a>
        <Link className="development-secondary-link" href="/stores">LIHAT LOKASI TOKO <span className="material-symbols-outlined">arrow_forward</span></Link>
        <button type="button" className="development-dialog-dismiss" onClick={() => dialog.current?.close()}>TUTUP & KEMBALI KE HALAMAN</button>
      </div>
    </dialog>
  </>;
}
