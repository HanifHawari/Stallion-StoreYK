"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OrderLookupForm } from "@/components/order-lookup-form";

export function OrderCheckDrawer({ preview = false }: { preview?: boolean }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prior; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return <>
    <button className="button button-dark" type="button" onClick={() => setOpen(true)}><span className="material-symbols-outlined">package_2</span> CEK PESANAN</button>
    {open && <div className="cart-drawer-backdrop" onMouseDown={() => setOpen(false)}><aside className="cart-drawer order-check-drawer" role="dialog" aria-modal="true" aria-labelledby="order-drawer-title" onMouseDown={(event) => event.stopPropagation()}>
      <div className="cart-drawer-heading"><h2 id="order-drawer-title">CEK PESANAN</h2><button aria-label="Tutup cek pesanan" onClick={() => setOpen(false)}><span className="material-symbols-outlined">close</span></button></div>
      <div className="order-check-drawer-body"><span className="material-symbols-outlined">package_2</span><h3>LACAK PESANANMU</h3><p>Masukkan nomor pesanan untuk melihat status terbaru.</p><OrderLookupForm compact /></div>
      <div className="order-check-drawer-footer"><Link href={preview ? "/check-order?preview=1" : "/check-order"} onClick={() => setOpen(false)}>BUKA HALAMAN CEK PESANAN <span className="material-symbols-outlined">arrow_forward</span></Link></div>
    </aside></div>}
  </>;
}

