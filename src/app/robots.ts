import type { MetadataRoute } from "next";
import { DEV_MODE } from "@/lib/flags";
import { siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  // Selama situs "dalam pengembangan" (DEV_MODE), mesin pencari dilarang mengindeks seluruh situs.
  if (DEV_MODE) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Halaman pribadi, transaksi, dan teknis tidak perlu diindeks.
      disallow: ["/admin", "/account", "/api/", "/cart", "/checkout", "/check-order", "/order/", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: new URL("/sitemap.xml", siteUrl()).toString(),
  };
}
