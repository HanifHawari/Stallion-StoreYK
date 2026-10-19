import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sepatu Lari", description: "Sepatu running dari easy run sampai race day, dari HOKA, Nike, ASICS, dan lainnya.", alternates: { canonical: "/running" } };
export default async function RunningPage() { return <CatalogView products={await getProducts()} mode="running" />; }
