"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { formatRupiah } from "@/lib/catalog";
import type { OrderStatus } from "@/lib/commerce";

type CheckedOrder = { id: string; status: OrderStatus; totalIdr: number; createdAt: string };
const statuses: Record<OrderStatus, string> = {
  awaiting_payment: "Menunggu pembayaran",
  paid: "Pembayaran berhasil",
  failed: "Pembayaran gagal",
  expired: "Pembayaran kedaluwarsa",
  cancelled: "Dibatalkan",
  payment_setup_failed: "Pembayaran belum tersedia",
  stock_issue: "Perlu ditinjau",
};

export function OrderLookupForm({ compact = false }: { compact?: boolean }) {
  const [orderId, setOrderId] = useState("");
  const [result, setResult] = useState<CheckedOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/orders/check", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim() }),
      });
      const data: { order?: CheckedOrder; error?: string } = await response.json();
      if (!response.ok || !data.order) setError(data.error ?? "Pesanan tidak ditemukan.");
      else setResult(data.order);
    } catch { setError("Koneksi bermasalah. Coba lagi."); }
    finally { setLoading(false); }
  }
  return <form className={"order-lookup-form " + (compact ? "order-lookup-compact" : "")} onSubmit={submit}>
    <label htmlFor={compact ? "drawer-order-id" : "page-order-id"}>NOMOR PESANAN<input id={compact ? "drawer-order-id" : "page-order-id"} value={orderId} onChange={(event) => setOrderId(event.target.value)} placeholder="ST-..." required maxLength={39} /></label>
    <small>Nomor pesanan tersedia pada halaman konfirmasi setelah checkout.</small>
    <button className="button button-dark" disabled={loading} type="submit"><span className="material-symbols-outlined">search</span> {loading ? "MENCARI..." : "CARI PESANAN"}</button>
    {error && <p className="order-lookup-error" role="alert">{error}</p>}
    {result && <div className="order-lookup-result" role="status"><span className="material-symbols-outlined">package_2</span><div><strong>{statuses[result.status]}</strong><small>{result.id}</small><span>{new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(new Date(result.createdAt))} · {formatRupiah(result.totalIdr)}</span></div><Link href={"/order/" + result.id}>DETAIL PESANAN <span className="material-symbols-outlined">arrow_forward</span></Link></div>}
  </form>;
}
