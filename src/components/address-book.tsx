"use client";

import { useState, type FormEvent } from "react";
import type { AddressInput, SavedAddress } from "@/lib/address";

const emptyForm: AddressInput = { label: "", recipientName: "", phone: "", address: "", city: "", postalCode: "", isDefault: false };

async function request(url: string, method: string, body?: unknown): Promise<unknown> {
  const response = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Permintaan gagal. Coba lagi.";
    throw new Error(message);
  }
  return data;
}

export function AddressBook({ initialAddresses, preview, max }: { initialAddresses: SavedAddress[]; preview: boolean; max: number }) {
  const [addresses, setAddresses] = useState(initialAddresses);
  const [editing, setEditing] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<AddressInput>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function reload() {
    const data = await request("/api/account/addresses", "GET");
    if (typeof data === "object" && data !== null && "addresses" in data && Array.isArray(data.addresses)) setAddresses(data.addresses as SavedAddress[]);
  }
  function open(target: SavedAddress | "new") {
    setError("");
    if (target === "new") { setEditing("new"); setForm({ ...emptyForm, isDefault: addresses.length === 0 }); return; }
    setEditing(target.id);
    setForm({ label: target.label, recipientName: target.recipientName, phone: target.phone, address: target.address, city: target.city, postalCode: target.postalCode, isDefault: target.isDefault });
  }
  async function run(action: () => Promise<unknown>) {
    if (preview || busy) return;
    setBusy(true); setError("");
    try { await action(); await reload(); setEditing(null); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Permintaan gagal. Coba lagi."); }
    finally { setBusy(false); }
  }
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void run(() => editing === "new" ? request("/api/account/addresses", "POST", form) : request(`/api/account/addresses/${editing}`, "PATCH", form));
  }
  function remove(address: SavedAddress) {
    if (!window.confirm(`Hapus alamat "${address.label}"?`)) return;
    void run(() => request(`/api/account/addresses/${address.id}`, "DELETE"));
  }
  function makeDefault(address: SavedAddress) {
    const { id, ...rest } = address;
    void run(() => request(`/api/account/addresses/${id}`, "PATCH", { ...rest, isDefault: true }));
  }

  const field = (name: Exclude<keyof AddressInput, "isDefault">, label: string, props: { autoComplete?: string; placeholder?: string; minLength?: number; maxLength?: number; pattern?: string; type?: string; required?: boolean } = {}) =>
    <label className="checkout-field"><span>{label}</span><input name={name} value={form[name]} disabled={preview || busy} required={props.required ?? true} onChange={(event) => setForm({ ...form, [name]: event.target.value })} {...props} /></label>;

  return <>
    {editing && <section className="member-panel member-address-form-panel">
      <div className="member-panel-heading"><h2>{editing === "new" ? "TAMBAH ALAMAT" : "UBAH ALAMAT"}</h2></div>
      <form className="member-form" onSubmit={submit}>
        <div className="form-grid">
          {field("label", "Label alamat", { placeholder: "Rumah, Kantor, Kos…", maxLength: 40, required: false })}
          {field("recipientName", "Nama penerima", { autoComplete: "name", minLength: 2, maxLength: 100 })}
          {field("phone", "Nomor telepon", { type: "tel", autoComplete: "tel", minLength: 8, maxLength: 25, placeholder: "08xxxxxxxxxx" })}
          {field("address", "Alamat lengkap", { autoComplete: "street-address", minLength: 10, maxLength: 300, placeholder: "Jalan, nomor rumah, RT/RW, kelurahan" })}
          {field("city", "Kota / kabupaten", { autoComplete: "address-level2", minLength: 2, maxLength: 100 })}
          {field("postalCode", "Kode pos", { autoComplete: "postal-code", pattern: "[0-9]{5}", maxLength: 5, placeholder: "12345" })}
        </div>
        <label className="member-checkbox"><input type="checkbox" checked={form.isDefault} disabled={preview || busy} onChange={(event) => setForm({ ...form, isDefault: event.target.checked })} /> Jadikan alamat utama</label>
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="member-form-actions">
          <button className="button button-dark" type="submit" disabled={preview || busy}>{busy ? "MENYIMPAN..." : "SIMPAN ALAMAT"}</button>
          <button className="button button-outline-dark" type="button" disabled={busy} onClick={() => { setEditing(null); setError(""); }}>BATAL</button>
        </div>
      </form>
    </section>}
    <section className="member-panel member-full-panel">
      <div className="member-panel-heading"><h2>ALAMAT TERSIMPAN</h2>{!editing && addresses.length < max && <button type="button" className="member-heading-button" disabled={preview} onClick={() => open("new")}>TAMBAH ALAMAT <span className="material-symbols-outlined">add</span></button>}</div>
      {!editing && error && <p className="form-message member-list-message" role="alert">{error}</p>}
      {addresses.length ? <div className="address-list">{addresses.map((address) => <article className="address-item" key={address.id}>
        <span className="material-symbols-outlined">location_on</span>
        <div>
          <strong>{address.label}{address.isDefault && <em>UTAMA</em>}</strong>
          <span>{address.recipientName} · {address.phone}</span>
          <small>{address.address}, {address.city} {address.postalCode}</small>
        </div>
        <div className="address-actions">
          <button type="button" disabled={busy} onClick={() => open(address)}>UBAH</button>
          {!address.isDefault && <button type="button" disabled={busy} onClick={() => makeDefault(address)}>JADIKAN UTAMA</button>}
          <button type="button" disabled={busy} onClick={() => remove(address)}>HAPUS</button>
        </div>
      </article>)}</div> : <div className="member-empty"><span className="material-symbols-outlined">location_on</span><p>Belum ada alamat tersimpan.</p>{!editing && <button className="button button-dark" type="button" disabled={preview} onClick={() => open("new")}>TAMBAH ALAMAT</button>}</div>}
    </section>
  </>;
}
