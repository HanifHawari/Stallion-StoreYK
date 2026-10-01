"use client";

import { useState } from "react";

export function CopyAddress({ address }: { address: string }) {
  const [status, setStatus] = useState("SALIN ALAMAT");
  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setStatus("ALAMAT TERSALIN");
    } catch {
      setStatus("GAGAL MENYALIN");
    }
  }
  return <button className="store-copy-address" type="button" onClick={copy} aria-live="polite"><span className="material-symbols-outlined">content_copy</span>{status}</button>;
}

