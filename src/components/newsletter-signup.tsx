"use client";

import { useState, type FormEvent } from "react";

export function NewsletterSignup({ email }: { email: string }) {
  const [value, setValue] = useState(email);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const response = await fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: value }) });
      const data: { error?: string; message?: string } = await response.json();
      setMessage(response.ok ? (data.message ?? "Email berhasil didaftarkan.") : (data.error ?? "Gagal mendaftar."));
    } catch { setMessage("Koneksi bermasalah. Coba lagi."); }
    finally { setLoading(false); }
  }
  return <form className="member-newsletter" onSubmit={submit}><label className="sr-only" htmlFor="member-newsletter-email">Email newsletter</label><input id="member-newsletter-email" type="email" placeholder="Masukkan alamat email" value={value} onChange={(event) => setValue(event.target.value)} required maxLength={254} /><button type="submit" disabled={loading}>{loading ? "MENYIMPAN..." : "SUBSCRIBE"}</button>{message && <p role="status">{message}</p>}</form>;
}

