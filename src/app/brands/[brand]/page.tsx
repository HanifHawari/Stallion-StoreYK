import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function BrandPage({ params }: { params: Promise<{ brand: string }> }) {
  const [{ brand }, products] = await Promise.all([params, getProducts()]);
  return <CatalogView products={products} mode="brand" brand={brand.toLowerCase()} />;
}
