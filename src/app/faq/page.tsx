import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, STORE_CONTACT } from "@/components/info-page";
import { DEV_MODE } from "@/lib/flags";

export const metadata: Metadata = { title: "FAQ", description: "Pertanyaan yang sering diajukan seputar belanja di Stallion Store: ukuran, pembayaran, pengiriman, dan pesanan." };

export default function FaqPage() {
  return <InfoPage crumb="FAQ" eyebrow="BANTUAN" title="PERTANYAAN UMUM" intro="Jawaban singkat untuk pertanyaan yang paling sering kami terima." updated={false}>
    <h2>PRODUK & UKURAN</h2>
    <details><summary>Apakah semua sepatu di Stallion Store original?</summary><p>Ya. Semua sepatu di Stallion Store 100% original. Jika produk yang kamu terima terbukti tidak original, uangmu kami kembalikan penuh.</p></details>
    <details><summary>Bagaimana memilih ukuran yang tepat?</summary><p>Semua sepatu memakai ukuran EU. Buka <Link href="/size-guide">Panduan Ukuran</Link> untuk tabel konversi tiap brand dan cara mengukur kaki, atau tekan tombol <strong>PANDUAN UKURAN</strong> di halaman produk.</p></details>
    <details><summary>Ukuran yang saya cari tidak muncul.</summary><p>Ukuran yang tidak tampil berarti stoknya sedang habis. Hubungi kami lewat <a href={STORE_CONTACT.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a> untuk menanyakan ketersediaan.</p></details>
    <h2>PEMBAYARAN</h2>
    <details><summary>Metode pembayaran apa saja yang tersedia?</summary><p>Pembayaran diproses oleh Midtrans; pilihan metode yang tersedia (misalnya transfer virtual account bank dan e-wallet) ditampilkan di halaman pembayaran.{DEV_MODE && " Saat ini pemesanan online belum dibuka; untuk memesan, hubungi kami lewat WhatsApp."}</p></details>
    <details><summary>Berapa lama batas waktu pembayaran?</summary><p>Selesaikan pembayaran dalam 24 jam setelah pesanan dibuat. Selama itu stok untuk pesananmu kami sisihkan. Setelah lewat, pesanan otomatis kedaluwarsa.</p></details>
    <details><summary>Saya sudah bayar, tapi status belum berubah.</summary><p>Konfirmasi dari Midtrans biasanya masuk dalam beberapa menit. Tekan <strong>MUAT ULANG STATUS</strong> di halaman pesanan. Jika setelah 1 jam belum berubah, hubungi kami dengan menyertakan nomor pesanan.</p></details>
    <h2>PENGIRIMAN</h2>
    <details><summary>Berapa ongkos kirimnya?</summary><p>Ongkir dihitung otomatis saat checkout berdasarkan kode pos tujuan dan kurir yang kamu pilih.</p></details>
    <details><summary>Kurir apa saja yang tersedia?</summary><p>JNE, SiCepat, dan AnterAja. Ongkos kirim dihitung otomatis saat checkout berdasarkan alamat tujuan dan layanan yang dipilih.</p></details>
    <details><summary>Berapa lama pesanan diproses dan dikirim?</summary><p>Pesanan diproses dalam 1–2 hari kerja setelah pembayaran terkonfirmasi. Nomor resi tampil di halaman pesanan begitu paket dikirim; estimasi tiba mengikuti layanan kurir yang dipilih.</p></details>
    <h2>PESANAN</h2>
    <details><summary>Bagaimana cara melihat status pesanan?</summary><p>Buka <Link href="/account/orders">Pesanan Saya</Link> di akunmu, atau gunakan <Link href="/check-order">Cek Pesanan</Link> dengan nomor pesanan.</p></details>
    <details><summary>Bisakah saya membatalkan pesanan?</summary><p>Pesanan yang belum dibayar bisa dibatalkan sendiri lewat tombol <strong>BATALKAN PESANAN</strong> di halaman pesanan. Untuk pesanan yang sudah dibayar, hubungi kami.</p></details>
    <details><summary>Bisakah saya menukar ukuran atau mengembalikan barang?</summary><p>Lihat <Link href="/returns">Kebijakan Pengembalian & Penukaran</Link>.</p></details>
    <h2>AKUN & TOKO</h2>
    <details><summary>Saya lupa kata sandi.</summary><p>Gunakan <Link href="/forgot-password">Lupa Kata Sandi</Link>. Kami akan mengirim tautan untuk membuat kata sandi baru ke email akunmu. Jika email tidak masuk dalam beberapa menit (cek juga folder spam), hubungi kami lewat WhatsApp.</p></details>
    <details><summary>Apakah bisa membeli langsung di toko?</summary><p>Bisa. Kunjungi <Link href="/stores">Stallion Store Jogja</Link> di Gejayan. Jam buka: {STORE_CONTACT.hours}.</p></details>
  </InfoPage>;
}
