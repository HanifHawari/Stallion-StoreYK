import type { MetadataRoute } from "next";
import { KNOWN_BRAND_SLUGS } from "@/lib/brands";
import { getProducts } from "@/lib/db";
import { siteUrl } from "@/lib/site";

// Dibuat saat diminta (bukan saat build) agar build tidak bergantung pada database; data produk dari cache katalog.
export const dynamic = "force-dynamic";

const STATIC_PATHS: [path: string, priority: number][] = [
  ["/", 1], ["/shoes", 0.9], ["/basketball", 0.8], ["/running", 0.8], ["/sale", 0.8],
  ["/size-guide", 0.5], ["/stores", 0.5], ["/faq", 0.4], ["/how-to-order", 0.4], ["/returns", 0.3], ["/terms", 0.2], ["/privacy", 0.2],
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const url = (path: string) => new URL(path, base).toString();
  let productSlugs: string[] = [];
  try { productSlugs = (await getProducts()).filter((product) => product.price !== null).map((product) => product.slug); }
  catch { /* Database tidak tersedia: sitemap tetap berisi halaman statis. */ }
  return [
    ...STATIC_PATHS.map(([path, priority]) => ({ url: url(path), changeFrequency: "weekly" as const, priority })),
    ...KNOWN_BRAND_SLUGS.map((slug) => ({ url: url(`/brands/${slug}`), changeFrequency: "weekly" as const, priority: 0.6 })),
    ...productSlugs.map((slug) => ({ url: url(`/shoes/${slug}`), changeFrequency: "daily" as const, priority: 0.7 })),
  ];
}
