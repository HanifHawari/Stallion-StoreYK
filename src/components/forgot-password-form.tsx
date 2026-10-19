"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/forgot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data: unknown = await response.json().catch(() => null);
      const field = (key: string) => typeof data === "object" && data !== null && key in data && typeof (data as Record<string, unknown>)[key] === "string" ? (data as Record<string, string>)[key] : "";
      if (!response.ok) throw new Error(field("error") || "Permintaan belum dapat diproses.");
      setSent(field("message") || "Periksa email kamu.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Permintaan belum dapat diproses.");
    } finally {
      setBusy(false);
    }
  }

  if (sent) return <>
    <p className="auth-notice" role="status">{sent}</p>
    <p className="auth-switch">Sudah ingat kata sandi? <Link href="/login">Login di sini</Link></p>
  </>;

  return <>
    <form onSubmit={submit}>
      <label className="auth-field"><span>EMAIL</span><div><span className="material-symbols-outlined">mail</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" maxLength={254} required placeholder="nama@email.com" /></div></label>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button button-dark auth-submit" type="submit" disabled={busy}>{busy ? "MEMPROSES..." : "KIRIM TAUTAN"}</button>
    </form>
    <p className="auth-switch">Sudah ingat kata sandi? <Link href="/login">Login di sini</Link></p>
  </>;
}
