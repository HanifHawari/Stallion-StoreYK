import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NavigationProgress } from "@/components/navigation-progress";
import { getCurrentCustomer } from "@/lib/auth";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Stallion Store — International Footwear", template: "%s | Stallion Store" },
  description: "Kurasi sepatu internasional untuk running, basketball, dan gaya hidup.",
  icons: { icon: "/images/logo/logo.png", shortcut: "/images/logo/logo.png", apple: "/images/logo/logo.png" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  let customer = null;
  try { customer = await getCurrentCustomer(); } catch { customer = null; }
  return <html lang="id"><body><NavigationProgress /><AuthProvider customer={customer}><SiteHeader /><main>{children}</main><SiteFooter /></AuthProvider></body></html>;
}




