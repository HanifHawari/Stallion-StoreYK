"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SizeTable } from "@/components/size-table";
import { chartForBrand } from "@/lib/size-guide";

export function SizeGuideButton({ brand, sizes }: { brand: string; sizes: string[] }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLElement>(null);
  const chart = chartForBrand(brand);

  useEffect(() => {
    if (!open) return;
    const prior = document.body.style.overflow;
    const priorFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    dialog.current?.querySelector<HTMLElement>("button")?.focus({ preventScroll: true });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
      if (event.key !== "Tab") return;
      const controls = dialog.current?.querySelectorAll<HTMLElement>("button,a[href]");
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prior;
      window.removeEventListener("keydown", onKey);
      if (priorFocus instanceof HTMLElement && priorFocus.isConnected) priorFocus.focus({ preventScroll: true });
    };
  }, [open]);

  if (!chart) return null;
  return <>
    <button type="button" className="size-guide-trigger" onClick={() => setOpen(true)} aria-haspopup="dialog"><span className="material-symbols-outlined">straighten</span> PANDUAN UKURAN</button>
    {/* Portal ke <body>: modal tidak boleh mewarisi gaya .options-heading tempat tombol berada. */}
    {open && createPortal(<div className="auth-prompt-backdrop" onMouseDown={() => setOpen(false)}>
      <section ref={dialog} className="size-guide-modal" role="dialog" aria-modal="true" aria-labelledby="size-guide-title" onMouseDown={(event) => event.stopPropagation()}>
        <button type="button" className="size-guide-close" aria-label="Tutup panduan ukuran" onClick={() => setOpen(false)}><span className="material-symbols-outlined">close</span></button>
        <span className="eyebrow">PANDUAN UKURAN</span>
        <h2 id="size-guide-title">{chart.label.toUpperCase()}</h2>
        <p className="size-guide-note">{chart.note}{sizes.length > 0 && " Baris yang disorot adalah ukuran EU yang tersedia untuk sepatu ini."}</p>
        <SizeTable chart={chart} highlight={sizes} />
        <p className="size-guide-note">Konversi bersifat panduan umum dan bisa sedikit berbeda per model. Butuh bantuan? Hubungi toko kami.</p>
        <Link className="text-link" href={`/size-guide?brand=${chart.id}`}>CARA MENGUKUR KAKI & SEMUA BRAND <span className="material-symbols-outlined">arrow_forward</span></Link>
      </section>
    </div>, document.body)}
  </>;
}
