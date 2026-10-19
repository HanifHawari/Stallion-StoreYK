import type { Metadata } from "next";
import { Fill, InfoPage, STORE_CONTACT } from "@/components/info-page";

export const metadata: Metadata = { title: "Kebijakan Privasi", description: "Cara Stallion Store mengumpulkan, menggunakan, dan melindungi data pribadi pelanggan." };

export default function PrivacyPage() {
  return <InfoPage crumb="KEBIJAKAN PRIVASI" eyebrow="KEBIJAKAN" title="KEBIJAKAN PRIVASI" intro="Kami menghargai privasimu. Halaman ini menjelaskan data apa yang kami kumpulkan dan bagaimana kami menggunakannya.">
    <h2>DATA YANG KAMI KUMPULKAN</h2>
    <ul>
      <li><strong>Data akun:</strong> nama, email, dan kata sandi (disimpan dalam bentuk hash, tidak dapat dibaca siapa pun).</li>
      <li><strong>Data pesanan:</strong> nama penerima, nomor telepon, alamat pengiriman, sepatu yang dibeli, dan status pembayaran.</li>
      <li><strong>Alamat tersimpan dan wishlist</strong> yang kamu simpan di akun.</li>
      <li><strong>Langganan email</strong> jika kamu mendaftar newsletter.</li>
    </ul>
    <p>Data kartu dan rekening pembayaran diproses langsung oleh Midtrans dan tidak disimpan oleh Stallion Store.</p>
    <h2>PENGGUNAAN DATA</h2>
    <p>Data digunakan untuk memproses dan mengirim pesanan, mengelola akun, menghubungi kamu terkait pesanan, mengirim kabar koleksi (jika berlangganan), serta menjaga keamanan layanan.</p>
    <h2>PIHAK KETIGA</h2>
    <p>Kami membagikan data seperlunya kepada: Midtrans (pembayaran), mitra pengiriman dan agregator ongkir (nama, telepon, alamat), serta penyedia hosting website. <Fill>daftar penyedia lain, mis. layanan email</Fill></p>
    <h2>COOKIE & PENYIMPANAN DI PERANGKAT</h2>
    <p>Kami memakai satu cookie sesi untuk menjaga kamu tetap login (berlaku 30 hari) dan penyimpanan lokal browser untuk isi keranjang. Kami tidak memakai cookie iklan. <Fill>sesuaikan jika nanti memakai analitik</Fill></p>
    <h2>PENYIMPANAN & KEAMANAN</h2>
    <p>Data disimpan di server <Fill>lokasi/penyedia server</Fill> dan disimpan selama akun aktif atau selama diperlukan untuk kewajiban hukum dan pajak. <Fill>jangka waktu retensi</Fill></p>
    <h2>HAK KAMU</h2>
    <p>Sesuai Undang-Undang No. 27 Tahun 2022 tentang Pelindungan Data Pribadi, kamu berhak mengakses, memperbaiki, dan meminta penghapusan data pribadimu, serta menarik persetujuan langganan email. Nama dan kata sandi dapat diubah langsung di Pengaturan Akun; permintaan lain kirim ke <a href={`mailto:${STORE_CONTACT.email}`}>{STORE_CONTACT.email}</a>.</p>
    <h2>PERUBAHAN KEBIJAKAN</h2>
    <p>Kebijakan ini dapat diperbarui sewaktu-waktu. Versi terbaru selalu tersedia di halaman ini.</p>
  </InfoPage>;
}
