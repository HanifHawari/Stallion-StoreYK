"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type VariantRow = { id: string; size: string; sku: string; stock: number; ordered: boolean };
type Draft = { id: string | null; size: string; sku: string; stock: string; original: number | null; ordered: boolean };

const REASONS = ["Restok dari supplier", "Koreksi hitung stok", "Barang rusak / hilang", "Terjual di toko offline", "Stok awal"];

export function VariantManager({ productId, slug, variants }: { productId: string; slug: string; variants: VariantRow[] }) {
  const router = useRouter();
  const toDraft = (rows: VariantRow[]): Draft[] => rows.map((row) => ({ id: row.id, size: row.size, sku: row.sku, stock: String(row.stock), original: row.stock, ordered: row.ordered }));
  const [rows, setRows] = useState<Draft[]>(toDraft(variants));
  // Data server berubah (setelah simpan / router.refresh): tampilkan ulang dari data terbaru.
  const [source, setSource] = useState(variants);
  if (source !== variants) { setSource(variants); setRows(toDraft(variants)); }
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");
  const dirty = rows.length !== variants.length || rows.some((row) => {
    const saved = variants.find((variant) => variant.id === row.id);
    return !saved || String(saved.stock) !== row.stock.trim() || saved.sku !== row.sku.trim().toUpperCase();
  });

  const update = (index: number, patch: Partial<Draft>) => { setSaved(""); setRows((current) => current.map((row, i) => i === index ? { ...row, ...patch } : row)); };
  const addRow = () => { setSaved(""); setRows((current) => [...current, { id: null, size: "", sku: "", stock: "0", original: null, ordered: false }]); };

  async function save() {
    if (busy) return;
    setBusy(true); setError(""); setSaved("");
    try {
      const payload = { reason, variants: rows.map((row) => ({ id: row.id, size: row.size.trim(), sku: (row.sku.trim() || `${slug}-${row.size.trim()}`).toUpperCase(), stock: Number(row.stock), originalStock: row.original })) };
      const response = await fetch(`/api/admin/products/${productId}/variants`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Stok gagal disimpan.");
      setSaved("Stok tersimpan."); setReason("");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Stok gagal disimpan."); }
    finally { setBusy(false); }
  }

  async function remove(index: number) {
    const row = rows[index];
    if (!row.id) { setRows((current) => current.filter((_, i) => i !== index)); return; }
    if (!window.confirm(`Hapus ukuran EU ${row.size}?`)) return;
    setBusy(true); setError("");
    try {
      const response = await fetch(`/api/admin/products/${productId}/variants?variantId=${encodeURIComponent(row.id)}`, { method: "DELETE" });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Ukuran gagal dihapus.");
      setRows((current) => current.filter((_, i) => i !== index));
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Ukuran gagal dihapus."); }
    finally { setBusy(false); }
  }

  return <section className="admin-card" id="stok">
    <div className="admin-card-heading"><h2>Ukuran & stok</h2><button type="button" className="admin-link-button" onClick={addRow} disabled={busy}>+ TAMBAH UKURAN</button></div>
    <p className="admin-hint">Ubah beberapa ukuran sekaligus lalu simpan. Ukuran dengan stok 0 tidak tampil di toko. Setiap perubahan stok tercatat di riwayat.</p>
    {rows.length ? <table className="admin-table admin-variant-table"><thead><tr><th>EU</th><th>SKU</th><th>Stok</th><th>Perubahan</th><th /></tr></thead><tbody>
      {rows.map((row, index) => {
        const delta = row.original === null ? Number(row.stock) || 0 : (Number(row.stock) || 0) - row.original;
        return <tr key={row.id ?? `new-${index}`}>
          <td>{row.id ? <strong>{row.size}</strong> : <input className="admin-input-sm" value={row.size} placeholder="42.5" inputMode="decimal" disabled={busy} onChange={(event) => update(index, { size: event.target.value })} aria-label="Ukuran EU" />}</td>
          <td><input className="admin-input" value={row.sku} placeholder={`${slug}-${row.size || "42"}`.toUpperCase()} disabled={busy} onChange={(event) => update(index, { sku: event.target.value })} aria-label={`SKU EU ${row.size}`} /></td>
          <td><input className="admin-input-sm" value={row.stock} inputMode="numeric" disabled={busy} onChange={(event) => update(index, { stock: event.target.value.replace(/[^0-9]/g, "") })} aria-label={`Stok EU ${row.size}`} /></td>
          <td className={delta > 0 ? "admin-ok-text" : delta < 0 ? "admin-danger" : "admin-muted"}>{delta > 0 ? `+${delta}` : delta || "—"}</td>
          <td>{!row.ordered && <button type="button" className="admin-link-button" disabled={busy} onClick={() => remove(index)}>Hapus</button>}</td>
        </tr>;
      })}
    </tbody></table> : <p className="admin-empty">Belum ada ukuran. Tambahkan ukuran EU yang dijual.</p>}
    <div className="admin-form-row">
      <label className="checkout-field"><span>Alasan perubahan</span><input value={reason} list="admin-stock-reasons" placeholder="mis. Restok dari supplier" maxLength={120} disabled={busy} onChange={(event) => setReason(event.target.value)} /></label>
      <datalist id="admin-stock-reasons">{REASONS.map((item) => <option key={item} value={item} />)}</datalist>
      <button className="button button-dark" type="button" disabled={busy || !dirty || reason.trim().length < 2} onClick={save}>{busy ? "MENYIMPAN..." : "SIMPAN STOK"}</button>
    </div>
    {error && <p className="form-message" role="alert">{error}</p>}
    {saved && <p className="member-form-success" role="status">{saved}</p>}
  </section>;
}
