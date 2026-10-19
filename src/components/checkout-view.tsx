"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { clearCartSilently, readCart, type CartItem } from "@/lib/cart";
import { formatRupiah } from "@/lib/catalog";
import { isShippingRate, record, type ShippingRate } from "@/lib/commerce";
import { useCartValidation } from "@/lib/use-cart-validation";
import type { SavedAddress } from "@/lib/address";

type CustomerForm = { name: string; email: string; phone: string; address: string; city: string; postalCode: string };
const emptyForm: CustomerForm = { name: "", email: "", phone: "", address: "", city: "", postalCode: "" };

export function CheckoutView({ shippingEnabled }: { shippingEnabled: boolean }) {
  const [items, setItems] = useState<CartItem[] | null>(null);
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [shippingError, setShippingError] = useState("");
  const quoteRequest = useRef<AbortController | null>(null);
  const validation = useCartValidation(items);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  useEffect(() => {
    const update = () => {
      setItems(readCart());
      quoteRequest.current?.abort();
      setRates([]); setSelectedRate(null); setShippingBusy(false); setShippingError("");
    };
    // Kembali dari Midtrans lewat tombol Back (bfcache): baca ulang keranjang agar order tidak dibuat dua kali.
    const restored = (event: PageTransitionEvent) => { if (event.persisted) { setBusy(false); window.dispatchEvent(new Event("stallion-cart-change")); } };
    update();
    window.addEventListener("stallion-cart-change", update);
    window.addEventListener("storage", update);
    window.addEventListener("pageshow", restored);
    return () => { window.removeEventListener("stallion-cart-change", update); window.removeEventListener("storage", update); window.removeEventListener("pageshow", restored); };
  }, []);
  useEffect(() => () => quoteRequest.current?.abort(), []);
  useEffect(() => {
    // Buku alamat: alamat utama mengisi form otomatis selama form masih kosong.
    const controller = new AbortController();
    fetch("/api/account/addresses", { signal: controller.signal }).then((response) => response.ok ? response.json() : null).then((data: unknown) => {
      if (!record(data) || !Array.isArray(data.addresses)) return;
      const list = data.addresses as SavedAddress[];
      setSavedAddresses(list);
      const preferred = list.find((address) => address.isDefault);
      if (preferred) setForm((current) => current.name || current.phone || current.address || current.city || current.postalCode ? current : { ...current, name: preferred.recipientName, phone: preferred.phone, address: preferred.address, city: preferred.city, postalCode: preferred.postalCode });
    }).catch(() => { /* Buku alamat opsional; form tetap bisa diisi manual. */ });
    return () => controller.abort();
  }, []);
  if (!items) return <div className="site-container checkout-loading">Memuat checkout...</div>;
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const hasPreview = items.some((item) => item.preview);
  const selectedAddressId = savedAddresses.find((address) => address.recipientName === form.name && address.phone === form.phone && address.address === form.address && address.city === form.city && address.postalCode === form.postalCode)?.id ?? "";
  function applySavedAddress(id: string) {
    const address = savedAddresses.find((entry) => entry.id === id);
    if (!address) return;
    quoteRequest.current?.abort(); setRates([]); setSelectedRate(null); setShippingBusy(false); setShippingError("");
    setForm({ ...form, name: address.recipientName, phone: address.phone, address: address.address, city: address.city, postalCode: address.postalCode });
  }

  async function checkShipping() {
    if (!shippingEnabled || !items?.length || hasPreview || !/^[0-9]{5}$/.test(form.postalCode)) return;
    quoteRequest.current?.abort();
    const controller = new AbortController();
    quoteRequest.current = controller;
    setShippingBusy(true); setShippingError(""); setRates([]); setSelectedRate(null);
    try {
      const response = await fetch("/api/shipping/rates", {
        method: "POST", headers: { "Content-Type": "application/json" }, signal: controller.signal,
        body: JSON.stringify({ postalCode: form.postalCode, items: items.map((item) => ({ productId: item.productId, size: item.size, quantity: item.quantity })) }),
      });
      const data: unknown = await response.json();
      if (!record(data)) throw new Error("Respons tarif pengiriman tidak valid.");
      if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "Tarif pengiriman belum tersedia.");
      if (!Array.isArray(data.rates) || !data.rates.length || !data.rates.every(isShippingRate)) throw new Error("Respons tarif pengiriman tidak valid.");
      if (!controller.signal.aborted) setRates(data.rates);
    } catch (caught) {
      if (!controller.signal.aborted) setShippingError(caught instanceof Error ? caught.message : "Tarif pengiriman belum tersedia.");
    } finally { if (!controller.signal.aborted) setShippingBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!items?.length || hasPreview || busy || !shippingEnabled || !selectedRate || shippingBusy || validation.unavailable.length) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: items.map((item) => ({ productId: item.productId, size: item.size, quantity: item.quantity })), customer: form, shipping: { courierCode: selectedRate.courierCode, serviceCode: selectedRate.serviceCode, price: selectedRate.price } }),
      });
      const data: unknown = await response.json();
      if (typeof data !== "object" || data === null) throw new Error("Respons checkout tidak valid.");
      if (!response.ok) {
        if (response.status === 409) { setRates([]); setSelectedRate(null); }
        throw new Error("error" in data && typeof data.error === "string" ? data.error : "Checkout gagal. Silakan coba lagi.");
      }
      if (!("redirectUrl" in data) || typeof data.redirectUrl !== "string") throw new Error("URL pembayaran tidak tersedia.");
      clearCartSilently();
      window.location.assign(data.redirectUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Checkout gagal. Silakan coba lagi.");
      setBusy(false);
    }
  }

  const field = (name: keyof CustomerForm, label: string, props: { type?: string; autoComplete?: string; placeholder?: string; minLength?: number; pattern?: string } = {}) =>
    <label className="checkout-field"><span>{label}</span><input required disabled={busy} name={name} value={form[name]} onChange={(event) => {
      if (name === "postalCode") { quoteRequest.current?.abort(); setRates([]); setSelectedRate(null); setShippingBusy(false); setShippingError(""); }
      setForm({ ...form, [name]: event.target.value });
    }} {...props} /></label>;

  const shippingOptions = <div className="checkout-shipping-options">
    {!shippingEnabled ? <p role="status">Tarif ongkir belum tersedia. Pembayaran menunggu tarif pengiriman.</p> : <>
      <button type="button" className="button button-dark" disabled={shippingBusy || busy || hasPreview || !/^[0-9]{5}$/.test(form.postalCode)} onClick={checkShipping}>{shippingBusy ? "MENGECEK ONGKIR..." : "CEK ONGKIR"}</button>
      {rates.length > 0 && <label className="checkout-field"><span>Layanan pengiriman</span><select required disabled={busy} value={selectedRate ? `${selectedRate.courierCode}:${selectedRate.serviceCode}` : ""} onChange={(event) => setSelectedRate(rates.find((rate) => `${rate.courierCode}:${rate.serviceCode}` === event.target.value) ?? null)}>
        <option value="">Pilih layanan kurir</option>{rates.map((rate) => <option key={`${rate.courierCode}:${rate.serviceCode}`} value={`${rate.courierCode}:${rate.serviceCode}`}>{rate.courierName} · {rate.serviceName} · {formatRupiah(rate.price)}{rate.duration ? ` (${rate.duration})` : ""}</option>)}
      </select></label>}
      {shippingError && <p className="checkout-alert" role="alert">{shippingError}</p>}
    </>}
  </div>;

  return <div className="site-container checkout-layout"><div className="checkout-main"><div className="page-title"><span className="eyebrow">THE FINAL STEP</span><h1>CHECKOUT</h1><p>Isi detail pengiriman, lalu lanjutkan ke halaman pembayaran Midtrans.</p></div>{items.length === 0 ? <div className="cart-empty"><h2>KERANJANG KOSONG</h2><Link href="/shoes" className="button button-orange">EXPLORE SHOES</Link></div> : <form onSubmit={submit} className="checkout-form"><div className="checkout-block"><h2><span>01</span> CONTACT DETAILS</h2><div className="form-grid">{field("name", "Nama lengkap", { autoComplete: "name", minLength: 2, placeholder: "Nama penerima" })}{field("email", "Email", { type: "email", autoComplete: "email", placeholder: "nama@email.com" })}{field("phone", "Nomor telepon", { type: "tel", autoComplete: "tel", minLength: 8, placeholder: "08xxxxxxxxxx" })}</div></div><div className="checkout-block"><h2><span>02</span> SHIPPING ADDRESS</h2>{savedAddresses.length > 0 && <label className="checkout-field checkout-saved-address"><span>Alamat tersimpan</span><select value={selectedAddressId} disabled={busy} onChange={(event) => applySavedAddress(event.target.value)}><option value="">Isi manual</option>{savedAddresses.map((address) => <option key={address.id} value={address.id}>{address.label}{address.isDefault ? " (utama)" : ""} · {address.recipientName}, {address.city}</option>)}</select></label>}<div className="form-grid">{field("address", "Alamat lengkap", { autoComplete: "street-address", minLength: 10, placeholder: "Jalan, nomor rumah, RT/RW, kelurahan" })}{field("city", "Kota / kabupaten", { autoComplete: "address-level2", minLength: 2, placeholder: "Kota tujuan" })}{field("postalCode", "Kode pos", { autoComplete: "postal-code", pattern: "[0-9]{5}", placeholder: "12345" })}</div>{shippingOptions}</div><div className="checkout-block"><h2><span>03</span> PAYMENT</h2><div className="payment-option"><span className="material-symbols-outlined">verified_user</span><div><strong>MIDTRANS SNAP</strong><p>Pilih metode pembayaran setelah menekan tombol lanjut.</p></div><span className="payment-selected">SELECTED</span></div></div>{hasPreview && <p className="checkout-alert">Produk pratinjau dari desain belum dapat dibayar. Masukkan katalog dan stok asli ke PostgreSQL terlebih dahulu.</p>}{validation.priceUpdated && <p className="checkout-alert" role="status">Harga beberapa sepatu sudah diperbarui sesuai harga terbaru. Periksa kembali total pesanan.</p>}{validation.unavailable.length > 0 && <p className="checkout-alert" role="alert">Tidak tersedia lagi: {validation.unavailable.map((item) => `${item.name} (EU ${item.size})`).join(", ")}. Hapus dari keranjang untuk melanjutkan.</p>}{error && <p className="checkout-alert" role="alert">{error}</p>}<button type="submit" className="button button-orange checkout-submit" disabled={busy || hasPreview || shippingBusy || !selectedRate || !shippingEnabled || validation.unavailable.length > 0}>{busy ? "MEMPROSES..." : selectedRate ? `PAY ${formatRupiah(subtotal + selectedRate.price)}` : "LANJUT KE PEMBAYARAN"} <span className="material-symbols-outlined">arrow_forward</span></button><p className="checkout-disclaimer">Harga dan stok diverifikasi kembali oleh server sebelum pembayaran dibuat.</p></form>}</div><aside className="summary-card checkout-summary"><h2>YOUR ORDER</h2>{items.map((item) => <div className="checkout-item" key={item.key}><img src={item.image} alt="" /><span><strong>{item.name}</strong><small>{item.brand} · EU {item.size} · Qty {item.quantity}</small></span><b>{formatRupiah(item.price * item.quantity)}</b></div>)}<div><span>Subtotal</span><strong>{formatRupiah(subtotal)}</strong></div><div><span>Ongkir</span><strong>{selectedRate ? formatRupiah(selectedRate.price) : "Belum dihitung"}</strong></div><div className="summary-total"><span>Total</span><strong>{selectedRate ? formatRupiah(subtotal + selectedRate.price) : "Menunggu ongkir"}</strong></div><p className="summary-secure"><span className="material-symbols-outlined">lock</span> Secure checkout powered by Midtrans</p></aside></div>;
}
