import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage } from "@/components/info-page";

export const metadata: Metadata = { title: "Cara Belanja", description: "Langkah belanja di Stallion Store: daftar akun, pilih ukuran, checkout, bayar lewat Midtrans, dan pantau pesanan." };

export default function HowToOrderPage() {
  return <InfoPage crumb="CARA BELANJA" eyebrow="BANTUAN" title="CARA BELANJA" intro="Tujuh langkah dari memilih sepatu sampai pesanan tiba di rumahmu." updated={false}>
    <ol className="info-steps">
      <li><strong>Buat akun atau login.</strong> <Link href="/register">Daftar</Link> dengan nama, email, dan kata sandi. Akun dibutuhkan untuk menyimpan wishlist, checkout, dan memantau pesanan.</li>
      <li><strong>Pilih sepatu.</strong> Jelajahi <Link href="/shoes">katalog</Link> lewat kategori, brand, atau pencarian.</li>
      <li><strong>Pilih ukuran EU.</strong> Ragu? Buka <strong>PANDUAN UKURAN</strong> di halaman produk atau <Link href="/size-guide">Panduan Ukuran</Link> lengkap. Lalu tekan <strong>ADD TO BAG</strong>.</li>
      <li><strong>Periksa keranjang.</strong> Atur jumlah di <Link href="/cart">keranjang</Link>. Harga dan ketersediaan diperiksa ulang otomatis.</li>
      <li><strong>Checkout.</strong> Isi data penerima dan alamat (atau pilih dari <Link href="/account/addresses">alamat tersimpan</Link>), masukkan kode pos, tekan <strong>CEK ONGKIR</strong>, lalu pilih layanan kurir.</li>
      <li><strong>Bayar lewat Midtrans.</strong> Kamu diarahkan ke halaman pembayaran Midtrans. Selesaikan pembayaran dalam 24 jam.</li>
      <li><strong>Pantau pesanan.</strong> Status pesanan bisa dilihat di <Link href="/account/orders">Pesanan Saya</Link>. Pesanan yang belum dibayar bisa dibatalkan dari halaman pesanan.</li>
    </ol>
    <p>Masih ada pertanyaan? Lihat <Link href="/faq">FAQ</Link>.</p>
  </InfoPage>;
}
