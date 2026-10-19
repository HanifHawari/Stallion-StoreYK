// Slug brand yang ditautkan dari menu header & marquee brand. Halaman brand ini selalu ada
// walaupun produknya belum aktif; slug lain hanya valid jika ada produknya.
export const KNOWN_BRAND_SLUGS = ["nike", "jordan", "under-armour", "adidas", "hoka", "new-balance", "puma", "vans", "converse", "asics"];

export function brandSlug(brand: string): string {
  return brand.toLowerCase().replaceAll(" ", "-");
}
