"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FULFILLMENT_LABEL, FULFILLMENT_STEPS, type FulfillmentStatus } from "@/lib/admin-labels";

async function send(url: string, method: string, body: unknown): Promise<void> {
  const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  if (response.ok) return;
  const data: unknown = await response.json().catch(() => null);
  throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Permintaan gagal.");
}

export function OrderAdminPanel({ orderId, status, fulfillment, tracking, note }: { orderId: string; status: string; fulfillment: string | null; tracking: string | null; note: string | null }) {
  const router = useRouter();
  const [step, setStep] = useState<FulfillmentStatus>((fulfillment as FulfillmentStatus | null) ?? "processing");
  const [trackingNumber, setTrackingNumber] = useState(tracking ?? "");
  const [adminNote, setAdminNote] = useState(note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  async function run(action: () => Promise<void>, success: string) {
    if (busy) return;
    setBusy(true); setError(""); setSaved("");
    try { await action(); setSaved(success); router.refresh(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Permintaan gagal."); }
    finally { setBusy(false); }
  }

  if (status === "stock_issue") return <section className="admin-card admin-alert-card">
    <div className="admin-card-heading"><h2>Masalah stok</h2></div>
    <p className="admin-hint">Pembayaran sudah diterima, tetapi stok kurang saat pembayaran masuk. Tambah stok di halaman produk lalu proses pesanan, atau batalkan dan kembalikan dana pelanggan secara manual.</p>
    <div className="member-form-actions">
      <button className="button button-dark" type="button" disabled={busy} onClick={() => run(() => send(`/api/admin/orders/${orderId}/resolve`, "POST", { action: "fulfill" }), "Stok dipotong, pesanan siap diproses.")}>POTONG STOK & PROSES</button>
      <button className="button button-outline-dark" type="button" disabled={busy} onClick={() => { if (window.confirm("Batalkan pesanan ini? Dana harus dikembalikan manual ke pelanggan.")) void run(() => send(`/api/admin/orders/${orderId}/resolve`, "POST", { action: "cancel" }), "Pesanan dibatalkan."); }}>BATALKAN (REFUND MANUAL)</button>
    </div>
    {error && <p className="form-message" role="alert">{error}</p>}
    {saved && <p className="member-form-success" role="status">{saved}</p>}
  </section>;

  if (status !== "paid") return null;
  const needsTracking = step === "shipped" || step === "delivered";
  return <section className="admin-card">
    <div className="admin-card-heading"><h2>Proses pesanan</h2></div>
    <div className="admin-steps" role="radiogroup" aria-label="Status proses">
      {FULFILLMENT_STEPS.map((value) => <label key={value} className={value === step ? "is-active" : undefined}><input type="radio" name="fulfillment" value={value} checked={value === step} disabled={busy} onChange={() => { setSaved(""); setStep(value); }} />{FULFILLMENT_LABEL[value]}</label>)}
    </div>
    <div className="admin-form-grid">
      <label className="checkout-field"><span>Nomor resi{needsTracking ? " (wajib)" : ""}</span><input value={trackingNumber} maxLength={60} disabled={busy} onChange={(event) => { setSaved(""); setTrackingNumber(event.target.value.toUpperCase()); }} placeholder="mis. JNE1234567890" /></label>
    </div>
    <label className="checkout-field"><span>Catatan internal (tidak terlihat pelanggan)</span><textarea value={adminNote} rows={3} maxLength={1000} disabled={busy} onChange={(event) => { setSaved(""); setAdminNote(event.target.value); }} /></label>
    {error && <p className="form-message" role="alert">{error}</p>}
    {saved && <p className="member-form-success" role="status">{saved}</p>}
    <div className="member-form-actions">
      <button className="button button-dark" type="button" disabled={busy || (needsTracking && !trackingNumber.trim())} onClick={() => run(() => send(`/api/admin/orders/${orderId}`, "PATCH", { fulfillmentStatus: step, trackingNumber, adminNote }), "Pesanan diperbarui.")}>{busy ? "MENYIMPAN..." : "SIMPAN"}</button>
    </div>
  </section>;
}
