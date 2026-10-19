import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { brandSlug, KNOWN_BRAND_SLUGS } from "@/lib/brands";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ brand: string }> }): Promise<Metadata> {
  const slug = (await params).brand.toLowerCase();
  // Nama tampilan brand diambil dari produk (mis. "New Balance"); cadangan dari slug.
  // Database mati → nama dari slug; layout menampilkan mode maintenance.
  const products = await getProducts().catch(() => []);
  const name = products.find((product) => brandSlug(product.brand) === slug)?.brand ?? slug.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  return { title: `Sepatu ${name}`, description: `Koleksi sepatu ${name} di Stallion Store: running, basketball, dan lifestyle.`, alternates: { canonical: `/brands/${slug}` } };
}
export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const [{ brand }, products] = await Promise.all([params, getProducts()]);
  const slug = brand.toLowerCase();
  if (!KNOWN_BRAND_SLUGS.includes(slug) && !products.some((product) => brandSlug(product.brand) === slug)) notFound();
  return <CatalogView products={products} mode="brand" brand={slug} />;
}
