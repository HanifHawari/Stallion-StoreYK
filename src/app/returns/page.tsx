import type { Metadata } from "next";
import Link from "next/link";
import { Fill, InfoPage, STORE_CONTACT } from "@/components/info-page";

export const metadata: Metadata = { title: "Pengembalian & Penukaran", description: "Kebijakan pengembalian barang dan penukaran ukuran di Stallion Store." };

export default function ReturnsPage() {
  return <InfoPage crumb="PENGEMBALIAN & PENUKARAN" eyebrow="KEBIJAKAN" title="PENGEMBALIAN & PENUKARAN" intro="Ketentuan menukar ukuran atau mengembalikan sepatu yang dibeli di Stallion Store.">
    <h2>PENUKARAN UKURAN</h2>
    <p>Penukaran ukuran dapat diajukan paling lambat <Fill>jumlah hari</Fill> hari setelah pesanan diterima, selama stok ukuran pengganti tersedia.</p>
    <h2>SYARAT BARANG</h2>
    <ul>
      <li>Sepatu belum dipakai di luar ruangan dan dalam kondisi baru.</li>
      <li>Label, tag, dan kotak sepatu masih lengkap dan tidak rusak.</li>
      <li>Disertai nomor pesanan sebagai bukti pembelian.</li>
      <li><Fill>syarat tambahan, mis. video unboxing</Fill></li>
    </ul>
    <h2>PENGEMBALIAN DANA</h2>
    <p><Fill>kapan pengembalian dana berlaku (mis. barang cacat produksi atau salah kirim), metode, dan lama proses refund</Fill></p>
    <h2>BIAYA PENGIRIMAN</h2>
    <p><Fill>siapa yang menanggung ongkir pengiriman balik dan pengiriman barang pengganti</Fill></p>
    <h2>CARA MENGAJUKAN</h2>
    <ol>
      <li>Hubungi kami lewat <a href={STORE_CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp {STORE_CONTACT.phone}</a> atau <a href={`mailto:${STORE_CONTACT.email}`}>{STORE_CONTACT.email}</a> dengan menyertakan nomor pesanan, alasan, dan foto sepatu.</li>
      <li>Tunggu konfirmasi dan alamat pengiriman balik dari tim kami.</li>
      <li>Kirim sepatu atau antar langsung ke <Link href="/stores">Stallion Store Jogja</Link>.</li>
      <li>Setelah barang kami periksa, ukuran pengganti dikirim atau dana dikembalikan sesuai ketentuan di atas.</li>
    </ol>
    <h2>PRODUK YANG TIDAK DAPAT DITUKAR</h2>
    <p><Fill>mis. produk sale/clearance tertentu</Fill></p>
  </InfoPage>;
}
