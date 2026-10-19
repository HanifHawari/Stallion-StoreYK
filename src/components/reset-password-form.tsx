"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ResetPasswordForm({ token }: { token: string }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (password !== confirm) { setError("Konfirmasi kata sandi tidak sama."); return; }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data: unknown = await response.json().catch(() => null);
      const field = (key: string) => typeof data === "object" && data !== null && key in data && typeof (data as Record<string, unknown>)[key] === "string" ? (data as Record<string, string>)[key] : "";
      if (!response.ok) throw new Error(field("error") || "Kata sandi belum dapat diubah.");
      setDone(field("message") || "Kata sandi berhasil diubah.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Kata sandi belum dapat diubah.");
    } finally {
      setBusy(false);
    }
  }

  if (done) return <>
    <p className="auth-notice" role="status">{done}</p>
    <Link className="button button-dark auth-submit" href="/login">LOGIN</Link>
  </>;

  const field = (label: string, value: string, setValue: (value: string) => void, placeholder: string) =>
    <label className="auth-field"><span>{label}</span><div><span className="material-symbols-outlined">key</span><input type={showPassword ? "text" : "password"} value={value} onChange={(event) => setValue(event.target.value)} autoComplete="new-password" minLength={8} maxLength={128} required placeholder={placeholder} /><button type="button" aria-label={showPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"} onClick={() => setShowPassword(!showPassword)}><span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span></button></div></label>;

  return <>
    <form onSubmit={submit}>
      {field("KATA SANDI BARU", password, setPassword, "Minimal 8 karakter")}
      {field("ULANGI KATA SANDI BARU", confirm, setConfirm, "Ketik ulang kata sandi baru")}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? "MEMPROSES..." : "SIMPAN KATA SANDI"}</button>
    </form>
    <p className="auth-switch">Tautan kedaluwarsa? <Link href="/forgot-password">Minta tautan baru</Link></p>
  </>;
}
