"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { CurrentCustomer } from "@/lib/auth";

type AuthContextValue = {
  customer: CurrentCustomer | null;
  ensureSignedIn: () => boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ customer, children }: { customer: CurrentCustomer | null; children: ReactNode }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const prompt = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  useEffect(() => { setPromptOpen(false); }, [pathname]);
  useEffect(() => {
    if (!promptOpen) return;
    const prior = document.body.style.overflow;
    const priorFocus = document.activeElement;
    document.body.style.overflow = "hidden";
    prompt.current?.querySelector<HTMLButtonElement>("button")?.focus({ preventScroll: true });
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
  function ensureSignedIn() {
    if (customer) return true;
    setPromptOpen(true);
    return false;
  }
  return <AuthContext.Provider value={{ customer, ensureSignedIn }}>
    {children}
    {promptOpen && pathname !== "/login" && pathname !== "/register" && <div className="auth-prompt-backdrop" onMouseDown={() => setPromptOpen(false)}>
      <section ref={prompt} className="auth-prompt" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title" onMouseDown={(event) => event.stopPropagation()}>
        <button className="auth-prompt-close" aria-label="Tutup" onClick={() => setPromptOpen(false)}><span className="material-symbols-outlined">close</span></button>
        <span className="material-symbols-outlined auth-prompt-icon">person</span>
        <h2 id="auth-prompt-title">LOGIN TERLEBIH DAHULU</h2>
        <p>Masuk untuk menyimpan favorit, menambahkan sepatu ke keranjang, dan checkout.</p>
        <Link className="button button-dark" href={"/login?next=" + next} onClick={() => setPromptOpen(false)}>LOGIN</Link>
        <Link className="auth-prompt-register" href={"/register?next=" + next} onClick={() => setPromptOpen(false)}>Belum punya akun? Daftar</Link>
      </section>
    </div>}
  </AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("AuthProvider tidak tersedia.");
  return context;
}

