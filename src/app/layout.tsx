import type { Metadata } from "next";
import { AuthProvider } from "@/components/auth-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { NavigationProgress } from "@/components/navigation-progress";
import { DevelopmentAnnouncement } from "@/components/development-announcement";
import { MaintenanceAnnouncement, MaintenancePage } from "@/components/maintenance-announcement";
import { ToastHost } from "@/components/toast";
import { getCurrentCustomer } from "@/lib/auth";
import { DEV_MODE } from "@/lib/flags";
import { isDatabaseAvailable } from "@/lib/health";
import { DEFAULT_SHARE_IMAGE, SITE_NAME, siteUrl } from "@/lib/site";
import "./globals.css";
import "leaflet/dist/leaflet.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Stallion Store — International Footwear", template: "%s | Stallion Store" },
  description: "Kurasi sepatu internasional untuk running, basketball, dan gaya hidup.",
  icons: { icon: "/images/logo/logo.png", shortcut: "/images/logo/logo.png", apple: "/images/logo/logo.png" },
  metadataBase: siteUrl(),
  openGraph: { type: "website", siteName: SITE_NAME, locale: "id_ID", images: [{ url: DEFAULT_SHARE_IMAGE, alt: SITE_NAME }] },
  twitter: { card: "summary_large_image" },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Database tidak dapat dihubungi (mis. server dijeda) → seluruh situs menampilkan mode maintenance.
  const online = await isDatabaseAvailable();
  let customer = null;
  if (online) try { customer = await getCurrentCustomer(); } catch { customer = null; }
  return <html lang="id"><body><NavigationProgress /><AuthProvider customer={customer}><SiteHeader /><main>{online ? children : <MaintenancePage />}</main><SiteFooter /><ToastHost />{online ? DEV_MODE && <DevelopmentAnnouncement /> : <MaintenanceAnnouncement />}</AuthProvider></body></html>;
}




