"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CurrentCustomer } from "@/lib/auth";

// Alasan login diminta: menentukan ikon & kalimat popup (tampilan sama untuk semua).
export type SignInReason = "wishlist" | "cart" | "checkout";
const PROMPT_COPY: Record<SignInReason, { icon: string; title: string; text: string }> = {
  wishlist: { icon: "favorite", title: "SIMPAN KE WISHLIST", text: "Masuk ke akun member agar produk favoritmu tersimpan dan bisa dibuka lagi kapan saja." },
  cart: { icon: "shopping_bag", title: "TAMBAH KE KERANJANG", text: "Masuk ke akun member agar sepatu pilihanmu tersimpan di keranjang." },
  checkout: { icon: "lock", title: "MASUK UNTUK CHECKOUT", text: "Masuk ke akun member untuk melanjutkan pesananmu." },
};

type AuthContextValue = {
  customer: CurrentCustomer | null;
  ensureSignedIn: (reason: SignInReason) => boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ customer, children }: { customer: CurrentCustomer | null; children: ReactNode }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const [reason, setReason] = useState<SignInReason>("wishlist");
  const prompt = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  // Tutup prompt saat pindah halaman (penyesuaian state saat render, bukan di effect).
  const [promptPathname, setPromptPathname] = useState(pathname);
  if (promptPathname !== pathname) { setPromptPathname(pathname); setPromptOpen(false); }
  useEffect(() => {
    if (!promptOpen) return;
    const prior = document.body.style.overflow;
    const priorFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    prompt.current?.querySelector<HTMLElement>("a[href],button")?.focus({ preventScroll: true });
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPromptOpen(false);
      if (event.key !== "Tab") return;
      const controls = prompt.current?.querySelectorAll<HTMLElement>("button,a[href]");
      const first = controls?.[0];
      const last = controls?.[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", close);
    return () => {
      document.body.style.overflow = prior;
      window.removeEventListener("keydown", close);
      if (priorFocus instanceof HTMLElement && priorFocus.isConnected) priorFocus.focus({ preventScroll: true });
    };
  }, [promptOpen]);
  function ensureSignedIn(why: SignInReason) {
    if (customer) return true;
    setReason(why);
    setPromptOpen(true);
    return false;
  }
  const copy = PROMPT_COPY[reason];
  return <AuthContext.Provider value={{ customer, ensureSignedIn }}>
    {children}
    {promptOpen && pathname !== "/login" && pathname !== "/register" && <div className="auth-prompt-backdrop" onMouseDown={() => setPromptOpen(false)}>
      <section ref={prompt} className="auth-prompt auth-prompt-member" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title" onMouseDown={(event) => event.stopPropagation()}>
        <span className="auth-prompt-badge" aria-hidden="true"><span className="material-symbols-outlined">{copy.icon}</span></span>
        <h2 id="auth-prompt-title">{copy.title}</h2>
        <p>{copy.text}</p>
        <Link className="auth-prompt-primary" href={"/login?next=" + next} onClick={() => setPromptOpen(false)}>MASUK</Link>
        <Link className="auth-prompt-secondary" href={"/register?next=" + next} onClick={() => setPromptOpen(false)}>Daftar member baru</Link>
        <button type="button" className="auth-prompt-later" onClick={() => setPromptOpen(false)}>Nanti saja</button>
      </section>
    </div>}
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider tidak tersedia.");
  return context;
}

