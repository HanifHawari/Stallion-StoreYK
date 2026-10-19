// Mode "Website dalam pengembangan" — aktif kecuali NEXT_PUBLIC_DEV_MODE=false.
// Selama aktif: daftar/login & fitur akun BERJALAN, tetapi belanja online ditutup — tombol checkout dan
// halaman /checkout membuka popup pengembangan, API checkout & ongkir menolak (503), dan robots.txt
// melarang mesin pencari mengindeks situs.
// Nilai NEXT_PUBLIC_* dibaca saat build, jadi ubah env lalu build ulang.
export const DEV_MODE = process.env.NEXT_PUBLIC_DEV_MODE !== "false";

export const CHECKOUT_CLOSED_MESSAGE = "Belanja online belum dibuka. Hubungi toko kami lewat WhatsApp untuk memesan.";
