import images from "@/data/design-images.json";

export type Product = {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: "Basketball" | "Running" | "Lifestyle";
  color: string;
  image: string;
  hoverImage?: string;
  price: number | null;
  compareAt: number | null;
  sizes: string[];
  badge?: string;
  description: string;
  preview?: boolean;
};

const basketballSizes = ["40", "41", "42", "42.5", "43", "44", "45"];
const runningSizes = ["39", "40", "41", "42", "43", "44"];

// These entries reproduce the supplied design. Prices are references for the
// preview only; database products must be reviewed before accepting orders.
export const previewProducts: Product[] = [
  { id: "preview-ja-4", slug: "nike-ja-4-jaws-ep", name: 'Ja 4 "Jaws" EP', brand: "Nike", category: "Basketball", color: "Steel Cyan", image: images["ja-4"], hoverImage: images["ja-4-hover"], price: 2199000, compareAt: null, sizes: basketballSizes, badge: "HOT DROP", description: "Sepatu basket signature dengan karakter cepat dan agresif untuk permainan di lapangan.", preview: true },
  { id: "preview-gt-cut", slug: "nike-gt-cut-academy-2-ep", name: "Air Zoom G.T. Cut Academy 2 EP", brand: "Nike", category: "Basketball", color: "White / Laser Cyan", image: images["gt-cut"], hoverImage: images["gt-cut-hover"], price: 1399000, compareAt: null, sizes: basketballSizes, badge: "NEW", description: "Siluet basket rendah dengan tampilan putih dan biru yang bersih.", preview: true },
  { id: "preview-luka-5", slug: "jordan-luka-5-ess-pf", name: "Luka 5 ESS PF", brand: "Jordan", category: "Basketball", color: "White / Black", image: images["luka-5"], hoverImage: images["luka-5-hover"], price: 2099000, compareAt: null, sizes: basketballSizes, badge: "NEW", description: "Sepatu basket signature Luka dengan tampilan putih yang fleksibel untuk court dan street.", preview: true },
  { id: "preview-nike-kids", slug: "nike-st-dynamite-cm-kids", name: "S.T. Dynamite CM Kids", brand: "Nike", category: "Basketball", color: "Silver Grey", image: images["nike-kids"], hoverImage: images["nike-kids-hover"], price: 929000, compareAt: null, sizes: ["35", "36", "37", "38", "39"], description: "Sepatu basket anak dengan warna netral dan detail modern.", preview: true },
  { id: "preview-sabrina", slug: "nike-sabrina-2-ep", name: "Wmns Sabrina 2 EP", brand: "Nike", category: "Basketball", color: "Pale Peach", image: images["sabrina-2"], hoverImage: images["sabrina-2-hover"], price: 999000, compareAt: 2099000, sizes: runningSizes, badge: "SALE", description: "Sepatu basket Sabrina dengan nuansa peach lembut.", preview: true },
  { id: "preview-curry", slug: "under-armour-curry-4-low", name: "Curry 4 Low Flotro", brand: "Under Armour", category: "Basketball", color: "Volt Yellow", image: images["curry-4"], hoverImage: images["curry-4-hover"], price: 799000, compareAt: 2759000, sizes: basketballSizes, badge: "CLEARANCE", description: "Sepatu basket low cut dengan warna kuning yang ekspresif.", preview: true },
  { id: "preview-luka-2", slug: "jordan-luka-2-pf-trick-shot", name: "Luka 2 PF 'Trick Shot' Edition", brand: "Jordan", category: "Basketball", color: "Electric Purple / White", image: images["luka-2"], hoverImage: images["luka-2-hover"], price: 599000, compareAt: 2099000, sizes: basketballSizes, badge: "CLEARANCE", description: "Sepatu basket Luka bernuansa ungu dan putih.", preview: true },
  { id: "preview-ae-2", slug: "adidas-anthony-edwards-2", name: 'Anthony Edwards 2 "Alphadawg"', brand: "Adidas", category: "Basketball", color: "Black / Silver", image: images["ae-2"], hoverImage: images["ae-2-hover"], price: 1000000, compareAt: 2000000, sizes: basketballSizes, badge: "NEW", description: "Sepatu basket Anthony Edwards dengan aksen hitam dan silver.", preview: true },
  { id: "preview-ae-2-christmas", slug: "adidas-anthony-edwards-2-christmas", name: 'Anthony Edwards 2 "Christmas"', brand: "Adidas", category: "Basketball", color: "Turquoise / Infrared", image: images["ae-2-christmas"], hoverImage: images["ae-2-christmas-hover"], price: 1200000, compareAt: 2000000, sizes: basketballSizes, badge: "LIMITED", description: "Sepatu basket Anthony Edwards dengan aksen turquoise dan merah cerah.", preview: true },
  { id: "preview-bondi", slug: "hoka-bondi-9", name: "Bondi 9", brand: "HOKA", category: "Running", color: "Vapor / Cream", image: images["hoka-bondi-9"], hoverImage: images["hoka-bondi-9-hover"], price: null, compareAt: null, sizes: runningSizes, badge: "HOKA", description: "Sepatu running dengan bantalan tebal untuk kenyamanan harian.", preview: true },
  { id: "preview-clifton", slug: "hoka-clifton-10", name: "Clifton 10", brand: "HOKA", category: "Running", color: "Skyward Blue", image: images["hoka-clifton-10"], hoverImage: images["hoka-clifton-10-hover"], price: null, compareAt: null, sizes: runningSizes, badge: "HOKA", description: "Sepatu lari harian dengan profil ringan dan bantalan nyaman.", preview: true },
];

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount);
}

export function discountPercent(product: Product): number | null {
  if (!product.price || !product.compareAt || product.compareAt <= product.price) return null;
  return Math.round((1 - product.price / product.compareAt) * 100);
}
