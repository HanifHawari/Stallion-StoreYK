"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Status = { busy: boolean; error: string; success: string };
const idle: Status = { busy: false, error: "", success: "" };

async function send(url: string, method: string, body?: unknown): Promise<string> {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data: unknown = await response.json().catch(() => null);
  const field = (key: string) => typeof data === "object" && data !== null && key in data && typeof (data as Record<string, unknown>)[key] === "string" ? (data as Record<string, string>)[key] : "";
  if (!response.ok) throw new Error(field("error") || "Permintaan gagal. Coba lagi.");
  return field("message");
}

export function AccountSettings({ name: initialName, email, preview }: { name: string; email: string; preview: boolean }) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [profile, setProfile] = useState<Status>(idle);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [password, setPassword] = useState<Status>(idle);
  const [sessions, setSessions] = useState<Status>(idle);

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview || profile.busy) return;
    setProfile({ ...idle, busy: true });
    try {
      const message = await send("/api/account/profile", "PATCH", { name });
      setProfile({ ...idle, success: message || "Nama berhasil disimpan." });
      router.refresh();
    } catch (caught) { setProfile({ ...idle, error: caught instanceof Error ? caught.message : "Nama belum dapat disimpan." }); }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (preview || password.busy) return;
    if (newPassword !== confirmPassword) { setPassword({ ...idle, error: "Konfirmasi kata sandi baru tidak sama." }); return; }
    setPassword({ ...idle, busy: true });
    try {
      const message = await send("/api/account/password", "POST", { currentPassword, newPassword });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      setPassword({ ...idle, success: message || "Kata sandi berhasil diubah." });
    } catch (caught) { setPassword({ ...idle, error: caught instanceof Error ? caught.message : "Kata sandi belum dapat diubah." }); }
  }

  async function signOutEverywhere() {
    if (preview || sessions.busy || !window.confirm("Keluar dari semua perangkat, termasuk perangkat ini?")) return;
    setSessions({ ...idle, busy: true });
    try {
      await send("/api/account/sessions", "DELETE");
      // Muat ulang penuh: status login di layout harus ikut kosong setelah semua sesi dicabut.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch (caught) { setSessions({ ...idle, error: caught instanceof Error ? caught.message : "Belum dapat keluar dari semua perangkat." }); }
  }

  const passwordField = (label: string, value: string, setValue: (value: string) => void, autoComplete: string) =>
    <label className="checkout-field"><span>{label}</span><input type="password" value={value} onChange={(event) => setValue(event.target.value)} autoComplete={autoComplete} minLength={autoComplete === "new-password" ? 8 : undefined} maxLength={128} required disabled={preview || password.busy} /></label>;

  return <div className="member-grid">
    <section className="member-panel">
      <div className="member-panel-heading"><h2>PROFIL</h2></div>
      <form className="member-form" onSubmit={saveName}>
        <label className="checkout-field"><span>Nama lengkap</span><input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" minLength={2} maxLength={100} required disabled={preview || profile.busy} /></label>
        <label className="checkout-field"><span>Email</span><input value={preview ? "Belum terhubung" : email} readOnly disabled /></label>
        <p className="member-form-note">Email dipakai untuk login dan tidak dapat diubah dari sini.</p>
        {profile.error && <p className="form-message" role="alert">{profile.error}</p>}
        {profile.success && <p className="member-form-success" role="status">{profile.success}</p>}
        <button className="button button-dark" type="submit" disabled={preview || profile.busy}>{profile.busy ? "MENYIMPAN..." : "SIMPAN NAMA"}</button>
      </form>
    </section>
    <section className="member-panel">
      <div className="member-panel-heading"><h2>KATA SANDI</h2></div>
      <form className="member-form" onSubmit={changePassword}>
        {passwordField("Kata sandi saat ini", currentPassword, setCurrentPassword, "current-password")}
        {passwordField("Kata sandi baru", newPassword, setNewPassword, "new-password")}
        {passwordField("Ulangi kata sandi baru", confirmPassword, setConfirmPassword, "new-password")}
        {password.error && <p className="form-message" role="alert">{password.error}</p>}
        {password.success && <p className="member-form-success" role="status">{password.success}</p>}
        <button className="button button-dark" type="submit" disabled={preview || password.busy}>{password.busy ? "MENYIMPAN..." : "UBAH KATA SANDI"}</button>
      </form>
    </section>
    <section className="member-panel member-span-full">
      <div className="member-panel-heading"><h2>KEAMANAN</h2></div>
      <div className="member-form">
        <p className="member-form-note">Gunakan ini jika kamu pernah login di perangkat lain atau merasa akunmu dipakai orang lain. Semua sesi akan diakhiri, termasuk di perangkat ini.</p>
        {sessions.error && <p className="form-message" role="alert">{sessions.error}</p>}
        <button className="button button-outline-dark" type="button" onClick={signOutEverywhere} disabled={preview || sessions.busy}>{sessions.busy ? "MEMPROSES..." : "KELUAR DARI SEMUA PERANGKAT"}</button>
      </div>
    </section>
  </div>;
}
