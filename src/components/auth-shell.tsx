import Link from "next/link";
import type { ReactNode } from "react";

// Kerangka halaman akun (lupa/atur ulang kata sandi) dengan markup & class yang sama seperti auth-form.tsx.
export function AuthShell({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return <div className="auth-page">
    <div className="auth-story">
      <div className="auth-story-shade" />
      <Link href="/" className="auth-story-brand">STALLION<span>STORE</span></Link>
      <div className="auth-story-copy"><span>INTERNATIONAL FOOTWEAR</span><h1>YOUR NEXT STEP<br />STARTS HERE.</h1><p>Simpan pilihanmu dan lanjutkan perjalanan belanja dengan akun Stallion Store.</p></div>
    </div>
    <div className="auth-form-side"><div className="auth-card">
      <Link href="/login" className="auth-back"><span className="material-symbols-outlined">arrow_back</span> KEMBALI KE LOGIN</Link>
      <Link href="/" className="auth-mobile-brand">STALLION<span>STORE</span></Link>
      <h2>{title}</h2>
      <p className="auth-intro">{intro}</p>
      {children}
    </div></div>
  </div>;
}
