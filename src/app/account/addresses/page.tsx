import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressBook } from "@/components/address-book";
import { MemberNavigation } from "@/components/member-navigation";
import { fromAddressRow, MAX_ADDRESSES, type AddressRow } from "@/lib/address";
import { getCurrentCustomer } from "@/lib/auth";
import { getPool } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Alamat Saya", robots: { index: false } };

export default async function AccountAddressesPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const isPreview = process.env.NODE_ENV === "development" && (await searchParams).preview === "1";
  const signedInCustomer = await getCurrentCustomer();
  if (!signedInCustomer && !isPreview) redirect("/login?next=/account/addresses");
  const customer = signedInCustomer ?? { id: "preview", name: "Pengunjung", email: "" };
  const addresses = isPreview ? [] : (await getPool().query<AddressRow>(
    "SELECT id, label, recipient_name, phone, address, city, postal_code, is_default FROM customer_addresses WHERE customer_id = $1 ORDER BY is_default DESC, created_at",
    [customer.id],
  )).rows.map(fromAddressRow);
  return <div className="account-page"><div className="site-container member-container">
    <MemberNavigation active="addresses" name={customer.name} preview={isPreview} />
    <div className="member-page-heading"><div><span className="eyebrow">STALLION STORE MEMBER</span><h1>ALAMAT SAYA</h1><p>Simpan alamat pengiriman agar checkout lebih cepat. Maksimal {MAX_ADDRESSES} alamat.</p></div></div>
    <AddressBook initialAddresses={addresses} preview={isPreview} max={MAX_ADDRESSES} />
  </div></div>;
}
