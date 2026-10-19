import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { getProducts } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sale & Clearance", description: "Pilihan sepatu diskon dan clearance di Stallion Store.", alternates: { canonical: "/sale" } };
export default async function SalePage() { return <CatalogView products={await getProducts()} mode="sale" />; }
