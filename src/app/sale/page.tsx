import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function SalePage() { return <CatalogView products={await getProducts()} mode="sale" />; }
