"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const isRegister = mode === "register";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/" + mode, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isRegister ? { name, email, password } : { email, password }),
      });
      const data: unknown = await response.json();
      if (!response.ok) {
        const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Autentikasi gagal.";
        throw new Error(message);
      }
      window.location.assign(next);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Autentikasi gagal.");
      setBusy(false);
    }
  }

  return <div className="auth-page">
    <div className="auth-story">
      <div className="auth-story-shade" />
      <Link href="/" className="auth-story-brand">STALLION<span>STORE</span></Link>
      <div className="auth-story-copy"><span>INTERNATIONAL FOOTWEAR</span><h1>YOUR NEXT STEP<br />STARTS HERE.</h1><p>Simpan pilihanmu dan lanjutkan perjalanan belanja dengan akun Stallion Store.</p></div>
    </div>
    <div className="auth-form-side"><div className="auth-card">
      <Link href="/" className="auth-mobile-brand">STALLION<span>STORE</span></Link>
      <h2>{isRegister ? "CREATE ACCOUNT" : "WELCOME BACK"}</h2>
      <p className="auth-intro">{isRegister ? "Daftar untuk mulai memilih sepatu favoritmu." : "Masukkan detail akunmu untuk melanjutkan."}</p>
      <form onSubmit={submit}>
        {isRegister && <label className="auth-field"><span>NAMA LENGKAP</span><div><span className="material-symbols-outlined">person</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} required placeholder="Nama lengkap" /></div></label>}
        <label className="auth-field"><span>EMAIL</span><div><span className="material-symbols-outlined">mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required placeholder="nama@email.com" /></div></label>
        <label className="auth-field"><span>KATA SANDI</span><div><span className="material-symbols-outlined">key</span><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={isRegister ? "new-password" : "current-password"} minLength={isRegister ? 8 : undefined} maxLength={128} required placeholder={isRegister ? "Minimal 8 karakter" : "Masukkan kata sandi"} /><button type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"} onClick={() => setShowPassword(!showPassword)}><span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span></button></div></label>
        {error && <p className="auth-error" role="alert">{error}</p>}
        <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? "MEMPROSES..." : isRegister ? "CREATE ACCOUNT" : "SIGN IN"}</button>
      </form>
      <p className="auth-switch">{isRegister ? "Sudah punya akun?" : "Belum punya akun?"} <Link href={(isRegister ? "/login" : "/register") + "?next=" + encodeURIComponent(next)}>{isRegister ? "Login di sini" : "Daftar di sini"}</Link></p>
    </div></div>
  </div>;
}

