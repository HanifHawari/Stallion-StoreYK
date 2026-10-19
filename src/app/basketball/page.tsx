import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sepatu Basket", description: "Sepatu basket pilihan untuk kecepatan, kontrol, dan keyakinan di lapangan.", alternates: { canonical: "/basketball" } };
export default async function BasketballPage() { return <CatalogView products={await getProducts()} mode="basketball" />; }
