"use client";

import { useEffect, useRef } from "react";

// Popup "Sedang maintenance" saat database tidak dapat dihubungi. Memakai tampilan popup pengembangan
// (class development-dialog) agar konsisten.
export function MaintenanceAnnouncement() {
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const prior = document.body.style.overflow;
    const restore = () => { document.body.style.overflow = prior; };
    if (!element.open) element.showModal();
    document.body.style.overflow = "hidden";
    element.addEventListener("close", restore);
    return () => { element.removeEventListener("close", restore); element.close(); restore(); };
  }, []);

  return <dialog ref={dialog} className="development-dialog" aria-labelledby="maintenance-dialog-title" aria-describedby="maintenance-dialog-description">
    <div className="development-dialog-content">
      <button type="button" className="development-dialog-close" aria-label="Tutup pengumuman" onClick={() => dialog.current?.close()}><span className="material-symbols-outlined">close</span></button>
      <div className="development-dialog-heading"><span className="material-symbols-outlined">build</span><div><span className="eyebrow">PENGUMUMAN STALLION STORE</span><h2 id="maintenance-dialog-title">SEDANG MAINTENANCE</h2></div></div>
      <p id="maintenance-dialog-description">Website Stallion Store sedang dalam perbaikan dan akan kembali sesegera mungkin. Untuk konsultasi ukuran, ketersediaan produk, dan belanja, hubungi toko kami di Gejayan.</p>
      <div className="development-dialog-store"><strong>STALLION STORE JOGJA</strong><p>Gejayan, Sleman, Yogyakarta</p><span>Setiap hari · 14.00–21.00 WIB</span></div>
      <a className="button button-orange" href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer"><span className="material-symbols-outlined">chat</span> HUBUNGI VIA WHATSAPP</a>
      <button type="button" className="development-dialog-dismiss" onClick={() => dialog.current?.close()}>TUTUP</button>
    </div>
  </dialog>;
}

// Isi halaman di balik popup selama maintenance (class lama page-title & cart-empty).
export function MaintenancePage() {
  return <div className="site-container checkout-layout"><div className="checkout-main"><div className="page-title"><span className="eyebrow">STALLION STORE</span><h1>MAINTENANCE</h1></div><div className="cart-empty"><span className="material-symbols-outlined">build</span><h2>SEDANG DALAM PERBAIKAN</h2><p>Kami sedang memperbaiki website. Silakan muat ulang halaman ini beberapa saat lagi, atau hubungi toko kami lewat WhatsApp.</p><a href="https://wa.me/6282120999926" target="_blank" rel="noopener noreferrer" className="button button-orange">HUBUNGI VIA WHATSAPP</a></div></div></div>;
}
