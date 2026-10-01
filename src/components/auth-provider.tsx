"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { CurrentCustomer } from "@/lib/auth";

type AuthContextValue = {
  customer: CurrentCustomer | null;
  ensureSignedIn: () => boolean;
};
const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ customer, children }: { customer: CurrentCustomer | null; children: ReactNode }) {
  const [promptOpen, setPromptOpen] = useState(false);
  const pathname = usePathname();
  const next = encodeURIComponent(pathname || "/");
  useEffect(() => { setPromptOpen(false); }, [pathname]);
  function ensureSignedIn() {
    if (customer) return true;
    setPromptOpen(true);
    return false;
  }
  return <AuthContext.Provider value={{ customer, ensureSignedIn }}>
    {children}
    {promptOpen && pathname !== "/login" && pathname !== "/register" && <div className="auth-prompt-backdrop" onMouseDown={() => setPromptOpen(false)}>
      <section className="auth-prompt" role="dialog" aria-modal="true" aria-labelledby="auth-prompt-title" onMouseDown={(event) => event.stopPropagation()}>
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

