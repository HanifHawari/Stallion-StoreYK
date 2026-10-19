"use client";

import { useRouter } from "next/navigation";
import { useState, type ChangeEvent, type FormEvent } from "react";
import { slugify } from "@/lib/slug";

export type ProductFormValues = {
  name: string; slug: string; brand: string; category: string; color: string; description: string;
  priceIdr: string; compareAtIdr: string; badge: string; active: boolean; imageUrl: string; hoverImageUrl: string;
  weightGrams: string; lengthCm: string; widthCm: string; heightCm: string;
};
export const emptyProduct: ProductFormValues = {
  name: "", slug: "", brand: "", category: "Basketball", color: "", description: "", priceIdr: "", compareAtIdr: "", badge: "", active: false,
  imageUrl: "", hoverImageUrl: "", weightGrams: "", lengthCm: "", widthCm: "", heightCm: "",
};

async function upload(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch("/api/admin/uploads", { method: "POST", body: form });
  const data: unknown = await response.json().catch(() => null);
  if (!response.ok || typeof data !== "object" || data === null || !("url" in data) || typeof data.url !== "string") {
    throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Foto gagal diunggah.");
  }
  return data.url;
}

export function ProductForm({ productId, initial, brands }: { productId?: string; initial: ProductFormValues; brands: string[] }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [slugTouched, setSlugTouched] = useState(Boolean(productId));
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<"" | "imageUrl" | "hoverImageUrl">("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const set = <K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) => { setSaved(""); setValues((current) => ({ ...current, [key]: value })); };

  async function choose(event: ChangeEvent<HTMLInputElement>, key: "imageUrl" | "hoverImageUrl") {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setUploading(key); setError("");
    try { set(key, await upload(file)); } catch (caught) { setError(caught instanceof Error ? caught.message : "Foto gagal diunggah."); }
    finally { setUploading(""); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setSaved("");
    // Rupiah & gram: titik/koma pemisah ribuan dibuang ("2.199.000"). Dimensi: koma desimal → titik ("30,5").
    const whole = (value: string) => value.trim() === "" ? null : Number(value.replace(/[.,\s]/g, ""));
    const decimal = (value: string) => value.trim() === "" ? null : Number(value.trim().replace(",", "."));
    const payload = { ...values, priceIdr: whole(values.priceIdr), compareAtIdr: whole(values.compareAtIdr), weightGrams: whole(values.weightGrams), lengthCm: decimal(values.lengthCm), widthCm: decimal(values.widthCm), heightCm: decimal(values.heightCm), hoverImageUrl: values.hoverImageUrl || null };
    try {
      const response = await fetch(productId ? `/api/admin/products/${productId}` : "/api/admin/products", { method: productId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data: unknown = await response.json().catch(() => null);
      if (!response.ok) throw new Error(typeof data === "object" && data !== null && "error" in data && typeof data.error === "string" ? data.error : "Produk gagal disimpan.");
      if (!productId && typeof data === "object" && data !== null && "id" in data && typeof data.id === "string") { router.push(`/admin/products/${data.id}?created=1`); return; }
      setSaved("Perubahan tersimpan.");
      router.refresh();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Produk gagal disimpan."); }
    finally { setBusy(false); }
  }

  const field = (key: keyof ProductFormValues, label: string, props: Record<string, unknown> = {}) =>
    <label className="checkout-field"><span>{label}</span><input value={String(values[key])} disabled={busy} onChange={(event) => set(key, event.target.value as never)} {...props} /></label>;
  const image = (key: "imageUrl" | "hoverImageUrl", label: string, required: boolean) => <div className="admin-image-field">
    <span>{label}</span>
    <div className="admin-image-preview">{values[key] ? <img src={values[key]} alt="" /> : <span className="material-symbols-outlined">image</span>}</div>
    <input value={values[key]} disabled={busy} required={required} placeholder="/images/products/... atau unggah" onChange={(event) => set(key, event.target.value)} aria-label={`Path ${label}`} />
    <div className="admin-image-actions">
      <label className="admin-link-button">{uploading === key ? "MENGUNGGAH..." : "UNGGAH FOTO"}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={busy || Boolean(uploading)} onChange={(event) => choose(event, key)} /></label>
      {!required && values[key] && <button type="button" className="admin-link-button" onClick={() => set(key, "")}>HAPUS</button>}
    </div>
  </div>;

  return <form className="admin-card admin-form" onSubmit={submit}>
    <div className="admin-card-heading"><h2>Data produk</h2></div>
    <div className="admin-form-grid">
      {field("name", "Nama produk", { required: true, maxLength: 120, onChange: (event: ChangeEvent<HTMLInputElement>) => { const name = event.target.value; setSaved(""); setValues((current) => ({ ...current, name, slug: slugTouched ? current.slug : slugify(name) })); } })}
      {field("slug", "Slug (URL)", { required: true, maxLength: 120, pattern: "[a-z0-9]+(-[a-z0-9]+)*", onChange: (event: ChangeEvent<HTMLInputElement>) => { setSlugTouched(true); set("slug", event.target.value.toLowerCase()); } })}
      {field("brand", "Brand", { required: true, maxLength: 60, list: "admin-brands" })}
      <datalist id="admin-brands">{brands.map((brand) => <option key={brand} value={brand} />)}</datalist>
      <label className="checkout-field"><span>Kategori</span><select value={values.category} disabled={busy} onChange={(event) => set("category", event.target.value)}><option>Basketball</option><option>Running</option><option>Lifestyle</option></select></label>
      {field("color", "Warna / colorway", { required: true, maxLength: 120 })}
      {field("badge", "Badge (opsional)", { maxLength: 20, placeholder: "NEW, SALE, HOT DROP…" })}
      {field("priceIdr", "Harga jual (Rp)", { inputMode: "numeric", placeholder: "Kosongkan untuk draft", onChange: (event: ChangeEvent<HTMLInputElement>) => { const priceIdr = event.target.value; setSaved(""); setValues((current) => ({ ...current, priceIdr, active: priceIdr.trim() ? current.active : false })); } })}
      {field("compareAtIdr", "Harga coret (Rp, opsional)", { inputMode: "numeric" })}
    </div>
    {productId && <p className="admin-hint">Mengubah slug akan mengubah alamat halaman produk; tautan lama tidak lagi berfungsi.</p>}
    <label className="checkout-field"><span>Deskripsi</span><textarea value={values.description} disabled={busy} maxLength={2000} rows={4} onChange={(event) => set("description", event.target.value)} /></label>
    <div className="admin-images">{image("imageUrl", "Foto utama", true)}{image("hoverImageUrl", "Foto hover (opsional)", false)}</div>
    <h3 className="admin-subheading">Paket pengiriman</h3>
    <p className="admin-hint">Berat & ukuran kotak setelah dikemas, dipakai untuk menghitung ongkir. Produk tanpa berat tidak bisa dicek ongkirnya.</p>
    <div className="admin-form-grid admin-form-grid-4">
      {field("weightGrams", "Berat (gram)", { inputMode: "numeric" })}
      {field("lengthCm", "Panjang (cm)", { inputMode: "decimal" })}
      {field("widthCm", "Lebar (cm)", { inputMode: "decimal" })}
      {field("heightCm", "Tinggi (cm)", { inputMode: "decimal" })}
    </div>
    <label className="member-checkbox"><input type="checkbox" checked={values.active} disabled={busy || !values.priceIdr.trim()} onChange={(event) => set("active", event.target.checked)} /> Aktif (tampil di toko){!values.priceIdr.trim() && " — isi harga dulu"}</label>
    {error && <p className="form-message" role="alert">{error}</p>}
    {saved && <p className="member-form-success" role="status">{saved}</p>}
    <div className="member-form-actions"><button className="button button-dark" type="submit" disabled={busy || Boolean(uploading)}>{busy ? "MENYIMPAN..." : productId ? "SIMPAN PERUBAHAN" : "SIMPAN PRODUK"}</button></div>
  </form>;
}
