<div align="center">
  <img src="public/images/sampul/hero-bg3.jpg" alt="Stallion Store Hero" width="100%" />

  # Stallion Store

  **International Footwear Selection — Run / Court / Everyday**
</div>

---

## 👟 Tentang Stallion Store

**Stallion Store** adalah sebuah e-commerce khusus untuk produk alas kaki premium. Kami mengurasi sepatu olahraga dan gaya hidup internasional dari berbagai merek ternama seperti Nike, Jordan, Adidas, Hoka, dan banyak lagi. Kami fokus menyediakan sepatu lari (*running*), basket (*basketball*), dan ikon pakaian sehari-hari (*lifestyle/everyday*). Sepatu yang tepat dapat mengubah setiap langkah Anda. Mulai dari sini, temukan masa depan Anda (*Find Your Forward*).

## 💻 Tech Stack

Proyek e-commerce modern ini dibangun menggunakan berbagai teknologi web mutakhir untuk memastikan performa yang cepat, interaktif, dan mulus:

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Library UI:** [React](https://react.dev/)
- **Bahasa Pemrograman:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** Vanilla CSS dipadukan dengan [Tailwind CSS](https://tailwindcss.com/) & [PostCSS](https://postcss.org/) untuk desain premium, animasi mikro, dan tata letak responsif.
- **Database:** PostgreSQL (dengan driver `pg`)
- **Peta & Lokasi:** [Leaflet](https://leafletjs.com/) (Menampilkan Store Offline)

## 🚀 Memulai (Running Locally)

Jika Anda ingin menjalankan proyek ini secara lokal:

1. Clone repositori ini:
   ```bash
   git clone https://github.com/HanifHawari/Stallion-StoreYK.git
   ```
2. Instal semua dependensi:
   ```bash
   npm install
   ```
3. Konfigurasi Environment Variables:
   Buat file `.env.local` dari `.env.example` dan masukkan URL database PostgreSQL Anda.
   ```bash
   cp .env.example .env.local
   ```
4. Jalankan server pengembangan lokal:
   ```bash
   npm run dev
   ```
5. Buka `http://localhost:3000` di peramban web Anda.
