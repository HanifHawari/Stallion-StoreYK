import { redirect } from "next/navigation";
import { getCurrentCustomer } from "@/lib/auth";
import { getProducts } from "@/lib/db";
import { MemberNavigation } from "@/components/member-navigation";
import { WishlistPanel } from "@/components/wishlist-panel";

export const dynamic = "force-dynamic";

export default async function AccountWishlistPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const isPreview = process.env.NODE_ENV === "development" && (await searchParams).preview === "1";
  const signedInCustomer = await getCurrentCustomer();
  if (!signedInCustomer && !isPreview) redirect("/login?next=/account/wishlist");
  const customer = signedInCustomer ?? { id: "preview", name: "Pengunjung", email: "" };
  const products = isPreview ? [] : await getProducts();
  return <div className="account-page"><div className="site-container member-container">
    <MemberNavigation active="wishlist" name={customer.name} preview={isPreview} />
    <div className="member-page-heading"><span className="eyebrow">STALLION STORE MEMBER</span><h1>WISHLIST SAYA</h1><p>Sepatu yang kamu simpan untuk dilihat kembali.</p></div>
    <WishlistPanel products={products} standalone />
  </div></div>;
}
