import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { getCurrentAdmin, getCurrentCustomer } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: { default: "Admin", template: "%s | Admin Stallion Store" }, robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: ReactNode }) {
  if (!process.env.DATABASE_URL) notFound();
  const admin = await getCurrentAdmin();
  if (!admin) {
    if (await getCurrentCustomer()) notFound();
    // Belum login: tiap halaman admin memanggil requireAdminPage(path) sendiri sehingga diarahkan ke
    // /login dengan tujuan halaman yang dibuka (layout tidak tahu path-nya). Tanpa bingkai admin.
    return <>{children}</>;
  }
  return <div className="admin-shell">
    <aside className="admin-sidebar">
      <Link href="/admin" className="admin-brand">STALLION<span>ADMIN</span></Link>
      <AdminNav />
      <div className="admin-user"><small>Login sebagai</small><strong>{admin.name}</strong><span>{admin.email}</span><Link href="/">← Kembali ke toko</Link></div>
    </aside>
    <div className="admin-main">{children}</div>
  </div>;
}
