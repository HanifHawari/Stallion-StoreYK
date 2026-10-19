"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// Notifikasi singkat di pojok layar (mis. "Disimpan ke wishlist"). Hilang sendiri; tidak menghalangi halaman.
export type Toast = { icon: string; title: string; text: string; href?: string; linkLabel?: string; tone?: "success" | "error" };
type ShownToast = Toast & { id: number };

const EVENT = "stallion-toast";
const VISIBLE_MS = 4000;
let counter = 0;

export function showToast(toast: Toast): void {
  window.dispatchEvent(new CustomEvent<ShownToast>(EVENT, { detail: { ...toast, id: ++counter } }));
}

export function ToastHost() {
  const [toast, setToast] = useState<ShownToast | null>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    const show = (event: Event) => { setPaused(false); setToast((event as CustomEvent<ShownToast>).detail); };
    window.addEventListener(EVENT, show);
    return () => window.removeEventListener(EVENT, show);
  }, []);

  useEffect(() => {
    if (!toast || paused) return;
    const timer = window.setTimeout(() => setToast(null), VISIBLE_MS);
    return () => window.clearTimeout(timer);
  }, [toast, paused]);

  return <div className="toast-region" role="status" aria-live="polite">
    {toast && <div key={toast.id} className={"toast" + (toast.tone === "error" ? " toast-error" : "")} onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
      <span className="toast-badge" aria-hidden="true"><span className="material-symbols-outlined">{toast.icon}</span></span>
      <div className="toast-body"><strong>{toast.title}</strong><span>{toast.text}</span>{toast.href && <Link className="toast-link" href={toast.href} onClick={() => setToast(null)}>{toast.linkLabel ?? "LIHAT"}</Link>}</div>
      <button type="button" className="toast-close" aria-label="Tutup notifikasi" onClick={() => setToast(null)}><span className="material-symbols-outlined">close</span></button>
    </div>}
  </div>;
}
