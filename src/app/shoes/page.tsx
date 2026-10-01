import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ShoesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [{ q }, products] = await Promise.all([searchParams, getProducts()]);
  return <CatalogView products={products} mode="all" initialQuery={q ?? ""} />;
}
