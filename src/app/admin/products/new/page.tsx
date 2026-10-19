import type { Metadata } from "next";
import { AdminHeader } from "@/components/admin/admin-ui";
import { emptyProduct, ProductForm } from "@/components/admin/product-form";
import { requireAdminPage } from "@/lib/admin";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Tambah Produk" };

export default async function NewProduct() {
  await requireAdminPage("/admin/products/new");
  const brands = (await getPool().query<{ brand: string }>("SELECT DISTINCT brand FROM products ORDER BY brand")).rows.map((row) => row.brand);
  return <>
    <AdminHeader title="Tambah produk" description="Simpan dulu data produk, lalu tambahkan ukuran & stok di halaman berikutnya." back={{ href: "/admin/products", label: "Produk" }} />
    <ProductForm initial={emptyProduct} brands={brands} />
  </>;
}
