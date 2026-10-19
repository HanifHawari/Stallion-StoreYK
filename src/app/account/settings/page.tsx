import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AccountSettings } from "@/components/account-settings";
import { MemberNavigation } from "@/components/member-navigation";
import { getCurrentCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Pengaturan Akun", robots: { index: false } };

export default async function AccountSettingsPage({ searchParams }: { searchParams: Promise<{ preview?: string }> }) {
  const isPreview = process.env.NODE_ENV === "development" && (await searchParams).preview === "1";
  const signedInCustomer = await getCurrentCustomer();
  if (!signedInCustomer && !isPreview) redirect("/login?next=/account/settings");
  const customer = signedInCustomer ?? { id: "preview", name: "Pengunjung", email: "" };
  return <div className="account-page"><div className="site-container member-container">
    <MemberNavigation active="settings" name={customer.name} preview={isPreview} />
    <div className="member-page-heading"><div><span className="eyebrow">STALLION STORE MEMBER</span><h1>PENGATURAN AKUN</h1><p>Kelola nama, kata sandi, dan keamanan akunmu.</p></div></div>
    <AccountSettings name={customer.name} email={customer.email} preview={isPreview} />
  </div></div>;
}
