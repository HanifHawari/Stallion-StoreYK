import type { Metadata } from "next";
import Link from "next/link";
import { InfoPage, STORE_CONTACT } from "@/components/info-page";

export const metadata: Metadata = { title: "Syarat & Ketentuan", description: "Syarat dan ketentuan penggunaan website dan pembelian di Stallion Store." };

export default function TermsPage() {
  return <InfoPage crumb="SYARAT & KETENTUAN" eyebrow="KEBIJAKAN" title="SYARAT & KETENTUAN" intro="Dengan menggunakan website dan berbelanja di Stallion Store, kamu menyetujui ketentuan berikut.">
    <h2>1. TENTANG KAMI</h2>
    <p>Website ini dikelola oleh Stallion Store, toko sepatu yang beralamat di {STORE_CONTACT.address}.</p>
    <h2>2. AKUN</h2>
    <p>Kamu bertanggung jawab menjaga kerahasiaan kata sandi dan seluruh aktivitas di akunmu. Data yang kamu berikan harus benar dan terbaru. Kami dapat menonaktifkan akun yang terindikasi penyalahgunaan.</p>
    <h2>3. PRODUK, HARGA & STOK</h2>
    <p>Foto produk dapat sedikit berbeda dengan warna asli karena pencahayaan dan layar. Harga dan stok dapat berubah sewaktu-waktu; harga dan stok final diverifikasi ulang saat pesanan dibuat. Stok untuk pesanan yang belum dibayar disisihkan paling lama 24 jam.</p>
    <h2>4. PEMBAYARAN</h2>
    <p>Pembayaran diproses oleh Midtrans. Stallion Store tidak menyimpan data kartu atau rekening pembayaranmu. Pesanan diproses setelah pembayaran terkonfirmasi.</p>
    <h2>5. PENGIRIMAN</h2>
    <p>Ongkos kirim dihitung saat checkout berdasarkan alamat tujuan dan layanan kurir yang dipilih. Estimasi waktu kirim berasal dari kurir dan tidak dijamin. Keterlambatan, kerusakan, atau kehilangan paket selama pengiriman mengikuti ketentuan dan proses klaim kurir; kami membantu pengajuan klaim dengan data pengiriman yang kami miliki.</p>
    <h2>6. PEMBATALAN</h2>
    <p>Pesanan yang belum dibayar dapat dibatalkan dari halaman pesanan. Pesanan yang tidak dibayar dalam 24 jam otomatis kedaluwarsa. Pesanan yang sudah dibayar tidak dapat dibatalkan oleh pembeli. Jika pesanan tidak dapat kami penuhi (misalnya stok habis), kami akan menghubungi pembeli dan mengembalikan dana secara penuh.</p>
    <h2>7. PENGEMBALIAN & PENUKARAN</h2>
    <p>Diatur dalam <Link href="/returns">Kebijakan Pengembalian & Penukaran</Link>.</p>
    <h2>8. HAK KEKAYAAN INTELEKTUAL</h2>
    <p>Merek dan logo produk adalah milik pemiliknya masing-masing. Teks, desain, dan logo Stallion Store di website ini tidak boleh disalin atau digunakan untuk kepentingan komersial tanpa izin tertulis dari kami.</p>
    <h2>9. BATASAN TANGGUNG JAWAB</h2>
    <p>Tanggung jawab kami terbatas pada nilai produk yang dibeli. Kami tidak bertanggung jawab atas kerugian tidak langsung, termasuk akibat salah memilih ukuran; gunakan halaman Panduan Ukuran atau hubungi kami sebelum membeli.</p>
    <h2>10. HUKUM YANG BERLAKU</h2>
    <p>Ketentuan ini tunduk pada hukum Republik Indonesia. Perselisihan diselesaikan terlebih dahulu secara musyawarah melalui WhatsApp atau email kami; jika tidak tercapai kesepakatan, diselesaikan melalui jalur hukum yang berlaku.</p>
    <h2>11. PERUBAHAN KETENTUAN</h2>
    <p>Kami dapat memperbarui ketentuan ini. Perubahan berlaku sejak dipublikasikan di halaman ini.</p>
    <h2>12. KONTAK</h2>
    <p>Pertanyaan tentang ketentuan ini dapat dikirim ke <a href={`mailto:${STORE_CONTACT.email}`}>{STORE_CONTACT.email}</a>.</p>
  </InfoPage>;
}
