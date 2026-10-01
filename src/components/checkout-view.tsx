"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { readCart, type CartItem } from "@/lib/cart";
import { formatRupiah } from "@/lib/catalog";
import { SHIPPING_FEE_IDR } from "@/lib/commerce";

type CustomerForm = { name: string; email: string; phone: string; address: string; city: string; postalCode: string };
const emptyForm: CustomerForm = { name: "", email: "", phone: "", address: "", city: "", postalCode: "" };

export function CheckoutView() {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { setItems(readCart()); }, []);
  if (!items) return <div className="site-container checkout-loading">Memuat checkout...</div>;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPreview = items.some((item) => item.preview);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items?.length || hasPreview || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, size: item.size, quantity: item.quantity })), customer: form }),
      });
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) throw new Error("Respons checkout tidak valid.");
      if (!response.ok) throw new Error("error" in data && typeof data.error === "string" ? data.error : "Checkout gagal. Silakan coba lagi.");
      if (!("redirectUrl" in data) || typeof data.redirectUrl !== "string") throw new Error("URL pembayaran tidak tersedia.");
      window.location.assign(data.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout gagal. Silakan coba lagi.");
      setBusy(false);
    }
  }

  const field = (name: keyof CustomerForm, label: string, props: { type?: string; autoComplete?: string; placeholder?: string; minLength?: number; pattern?: string } = {}) =>
    <label className="checkout-field"><span>{label}</span><input required name={name} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} {...props} /></label>;

  return <div className="site-container checkout-layout"><div className="checkout-main"><div className="page-title"><span className="eyebrow">THE FINAL STEP</span><h1>CHECKOUT</h1><p>Isi detail pengiriman, lalu lanjutkan ke halaman pembayaran Midtrans.</p></div>{items.length === 0 ? <div className="cart-empty"><h2>KERANJANG KOSONG</h2><Link href="/shoes" className="button button-orange">EXPLORE SHOES</Link></div> : <form onSubmit={submit} className="checkout-form"><div className="checkout-block"><h2><span>01</span> CONTACT DETAILS</h2><div className="form-grid">{field("name", "Nama lengkap", { autoComplete: "name", minLength: 2, placeholder: "Nama penerima" })}{field("email", "Email", { type: "email", autoComplete: "email", placeholder: "nama@email.com" })}{field("phone", "Nomor telepon", { type: "tel", autoComplete: "tel", minLength: 8, placeholder: "08xxxxxxxxxx" })}</div></div><div className="checkout-block"><h2><span>02</span> SHIPPING ADDRESS</h2><div className="form-grid">{field("address", "Alamat lengkap", { autoComplete: "street-address", minLength: 10, placeholder: "Jalan, nomor rumah, RT/RW, kelurahan" })}{field("city", "Kota / kabupaten", { autoComplete: "address-level2", minLength: 2, placeholder: "Kota tujuan" })}{field("postalCode", "Kode pos", { autoComplete: "postal-code", pattern: "[0-9]{5}", placeholder: "12345" })}</div></div><div className="checkout-block"><h2><span>03</span> PAYMENT</h2><div className="payment-option"><span className="material-symbols-outlined">verified_user</span><div><strong>MIDTRANS SNAP</strong><p>Pilih metode pembayaran setelah menekan tombol lanjut.</p></div><span className="payment-selected">SELECTED</span></div></div>{hasPreview && <p className="checkout-alert">Produk pratinjau dari desain belum dapat dibayar. Masukkan katalog dan stok asli ke PostgreSQL terlebih dahulu.</p>}{error && <p className="checkout-alert" role="alert">{error}</p>}<button type="submit" className="button button-orange checkout-submit" disabled={busy || hasPreview}>{busy ? "MEMPROSES..." : `PAY ${formatRupiah(subtotal + SHIPPING_FEE_IDR)}`} <span className="material-symbols-outlined">arrow_forward</span></button><p className="checkout-disclaimer">Harga dan stok diverifikasi kembali oleh server sebelum pembayaran dibuat.</p></form>}</div><aside className="summary-card checkout-summary"><h2>YOUR ORDER</h2>{items.map((item) => <div className="checkout-item" key={item.key}><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.brand} · EU {item.size} · Qty {item.quantity}</small></span><b>{formatRupiah(item.price * item.quantity)}</b></div>)}<div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div><span>Flat shipping</span><strong>{formatRupiah(SHIPPING_FEE_IDR)}</strong></div><div className="summary-total"><span>Total</span><strong>{formatRupiah(subtotal + SHIPPING_FEE_IDR)}</strong></div><p className="summary-secure"><span className="material-symbols-outlined">lock</span> Secure checkout powered by Midtrans</p></aside></div>;
}
