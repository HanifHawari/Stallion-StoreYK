// Panduan ukuran per brand. [VERIFIKASI CLIENT] Angka di bawah adalah konversi umum yang
// dipublikasikan masing-masing brand untuk ukuran pria/unisex; toko wajib mencocokkannya dengan
// tabel resmi terbaru sebelum launch.
export type SizeRow = { usM: string; usW: string; uk: string; eu: string; cm: string };
export type SizeChart = { id: string; label: string; brands: string[]; note: string; rows: SizeRow[] };

// [US pria, UK, EU, CM]; US wanita = US pria + selisih `womenOffset`.
type Base = [number, number, string, number];

function rows(base: Base[], womenOffset: number): SizeRow[] {
  const half = (value: number) => Number.isInteger(value) ? String(value) : value.toFixed(1);
  return base.map(([usM, uk, eu, cm]) => ({ usM: half(usM), usW: half(usM + womenOffset), uk: half(uk), eu, cm: Number.isInteger(cm * 10) ? cm.toFixed(1) : String(cm) }));
}

const nike: Base[] = [[6, 5.5, "38.5", 24], [6.5, 6, "39", 24.5], [7, 6, "40", 25], [7.5, 6.5, "40.5", 25.5], [8, 7, "41", 26], [8.5, 7.5, "42", 26.5], [9, 8, "42.5", 27], [9.5, 8.5, "43", 27.5], [10, 9, "44", 28], [10.5, 9.5, "44.5", 28.5], [11, 10, "45", 29], [11.5, 10.5, "45.5", 29.5], [12, 11, "46", 30], [13, 12, "47.5", 31]];
const adidas: Base[] = [[6, 5.5, "38 2/3", 24], [6.5, 6, "39 1/3", 24.5], [7, 6.5, "40", 25], [7.5, 7, "40 2/3", 25.5], [8, 7.5, "41 1/3", 26], [8.5, 8, "42", 26.5], [9, 8.5, "42 2/3", 27], [9.5, 9, "43 1/3", 27.5], [10, 9.5, "44", 28], [10.5, 10, "44 2/3", 28.5], [11, 10.5, "45 1/3", 29], [11.5, 11, "46", 29.5], [12, 11.5, "46 2/3", 30], [13, 12.5, "48", 31]];
const hoka: Base[] = [[7, 6.5, "40", 25], [7.5, 7, "40 2/3", 25.5], [8, 7.5, "41 1/3", 26], [8.5, 8, "42", 26.5], [9, 8.5, "42 2/3", 27], [9.5, 9, "43 1/3", 27.5], [10, 9.5, "44", 28], [10.5, 10, "44 2/3", 28.5], [11, 10.5, "45 1/3", 29], [11.5, 11, "46", 29.5], [12, 11.5, "46 2/3", 30], [13, 12.5, "48", 31]];
const asics: Base[] = [[6, 5, "39", 24.5], [6.5, 5.5, "39.5", 24.75], [7, 6, "40", 25.25], [7.5, 6.5, "40.5", 25.5], [8, 7, "41.5", 26], [8.5, 7.5, "42", 26.5], [9, 8, "42.5", 27], [9.5, 8.5, "43.5", 27.5], [10, 9, "44", 28], [10.5, 9.5, "44.5", 28.25], [11, 10, "45", 28.5], [11.5, 10.5, "46", 29], [12, 11, "46.5", 29.5], [13, 12, "48", 30.5]];
const newBalance: Base[] = [[6, 5.5, "38.5", 24], [6.5, 6, "39.5", 24.5], [7, 6.5, "40", 25], [7.5, 7, "40.5", 25.5], [8, 7.5, "41.5", 26], [8.5, 8, "42", 26.5], [9, 8.5, "42.5", 27], [9.5, 9, "43", 27.5], [10, 9.5, "44", 28], [10.5, 10, "44.5", 28.5], [11, 10.5, "45", 29], [11.5, 11, "45.5", 29.5], [12, 11.5, "46.5", 30], [13, 12.5, "47.5", 31]];
const puma: Base[] = [[6, 5, "38", 24], [6.5, 5.5, "38.5", 24.5], [7, 6, "39", 25], [7.5, 6.5, "40", 25.5], [8, 7, "40.5", 26], [8.5, 7.5, "41", 26.5], [9, 8, "42", 27], [9.5, 8.5, "42.5", 27.5], [10, 9, "43", 28], [10.5, 9.5, "44", 28.5], [11, 10, "44.5", 29], [11.5, 10.5, "45", 29.5], [12, 11, "46", 30], [13, 12, "47", 31]];
const vans: Base[] = [[6, 5, "38.5", 24], [6.5, 5.5, "39", 24.5], [7, 6, "40", 25], [7.5, 6.5, "40.5", 25.5], [8, 7, "41", 26], [8.5, 7.5, "42", 26.5], [9, 8, "42.5", 27], [9.5, 8.5, "43", 27.5], [10, 9, "44", 28], [10.5, 9.5, "44.5", 28.5], [11, 10, "45", 29], [12, 11, "46", 30], [13, 12, "47", 31]];
const converse: Base[] = [[6, 6, "39", 24.5], [6.5, 6.5, "39.5", 25], [7, 7, "40", 25.5], [7.5, 7.5, "41", 26], [8, 8, "41.5", 26.5], [8.5, 8.5, "42", 27], [9, 9, "42.5", 27.5], [9.5, 9.5, "43", 28], [10, 10, "44", 28.5], [10.5, 10.5, "44.5", 29], [11, 11, "45", 29.5], [12, 12, "46.5", 30.5]];
const underArmour: Base[] = [[6, 5.5, "38.5", 24], [6.5, 6, "39", 24.5], [7, 6, "40", 25], [7.5, 6.5, "40.5", 25.5], [8, 7, "41", 26], [8.5, 7.5, "42", 26.5], [9, 8, "42.5", 27], [9.5, 8.5, "43", 27.5], [10, 9, "44", 28], [10.5, 9.5, "44.5", 28.5], [11, 10, "45", 29], [11.5, 10.5, "45.5", 29.5], [12, 11, "46", 30], [13, 12, "47.5", 31]];

export const SIZE_CHARTS: SizeChart[] = [
  { id: "nike", label: "Nike & Jordan", brands: ["Nike", "Jordan"], note: "Ukuran wanita Nike & Jordan = ukuran pria + 1,5.", rows: rows(nike, 1.5) },
  { id: "adidas", label: "Adidas", brands: ["Adidas"], note: "Ukuran EU Adidas memakai pecahan (1/3 dan 2/3). Ukuran wanita = ukuran pria + 1.", rows: rows(adidas, 1) },
  { id: "hoka", label: "HOKA", brands: ["HOKA"], note: "Ukuran wanita HOKA = ukuran pria + 1,5.", rows: rows(hoka, 1.5) },
  { id: "asics", label: "ASICS", brands: ["ASICS"], note: "Ukuran wanita ASICS = ukuran pria + 1,5. Panjang kaki (CM) adalah acuan paling akurat.", rows: rows(asics, 1.5) },
  { id: "new-balance", label: "New Balance", brands: ["New Balance"], note: "Model unisex seperti 530 memakai ukuran pria. Ukuran wanita = ukuran pria + 1,5.", rows: rows(newBalance, 1.5) },
  { id: "puma", label: "Puma", brands: ["Puma"], note: "Ukuran wanita Puma = ukuran pria + 1,5.", rows: rows(puma, 1.5) },
  { id: "vans", label: "Vans", brands: ["Vans"], note: "Ukuran Vans adalah unisex; ukuran wanita = ukuran pria + 1,5.", rows: rows(vans, 1.5) },
  { id: "converse", label: "Converse", brands: ["Converse"], note: "Ukuran US pria Converse sama dengan ukuran UK. Ukuran wanita = ukuran pria + 2.", rows: rows(converse, 2) },
  { id: "under-armour", label: "Under Armour", brands: ["Under Armour"], note: "Ukuran wanita Under Armour = ukuran pria + 1,5.", rows: rows(underArmour, 1.5) },
];

export function chartForBrand(brand: string): SizeChart | undefined {
  const key = brand.trim().toLowerCase();
  return SIZE_CHARTS.find((chart) => chart.brands.some((name) => name.toLowerCase() === key));
}

export const MEASURE_STEPS = [
  "Letakkan selembar kertas di lantai yang rata, lalu berdiri di atasnya dengan tumit menempel ke dinding.",
  "Tandai ujung jari terpanjang dengan pensil, atau minta bantuan orang lain agar posisi tetap tegak.",
  "Ukur jarak dari tepi kertas (tumit) sampai tanda tersebut dalam sentimeter. Ini panjang kakimu.",
  "Ulangi untuk kaki satunya dan gunakan hasil yang lebih panjang. Ukur sore hari saat kaki sedikit mengembang.",
  "Cocokkan panjang kaki dengan kolom CM pada tabel. Jika berada di antara dua ukuran, pilih yang lebih besar.",
];
