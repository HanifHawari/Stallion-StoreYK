"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function cancel() {
    if (busy || !window.confirm("Batalkan pesanan ini? Pesanan yang dibatalkan tidak dapat dibayar lagi.")) return;
    setBusy(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        window.alert(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Pesanan belum dapat dibatalkan.");
        setBusy(false);
        return;
      }
      router.refresh();
    } catch {
      window.alert("Koneksi bermasalah. Coba lagi.");
      setBusy(false);
    }
  }
  return <button type="button" className="button button-outline-dark" disabled={busy} onClick={cancel}>{busy ? "MEMBATALKAN..." : "BATALKAN PESANAN"}</button>;
}
