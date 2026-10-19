import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Semua Sepatu", description: "Jelajahi sepatu internasional untuk running, basketball, dan keseharian dari Nike, Jordan, Adidas, HOKA, ASICS, New Balance, dan lainnya.", alternates: { canonical: "/shoes" } };
export default async function ShoesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, products] = await Promise.all([searchParams, getProducts()]);
  return <CatalogView products={products} mode="all" initialQuery={q ?? ""} />;
}
