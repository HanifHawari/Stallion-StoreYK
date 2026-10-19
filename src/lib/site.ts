// URL publik situs untuk metadata, sitemap, robots, dan JSON-LD. Diambil dari PUBLIC_SITE_URL;
// tanpa itu (development) memakai localhost agar URL absolut tetap valid.
export function siteUrl(): URL {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured) {
    try {
      const url = new URL(configured);
      if (url.protocol === "https:" || url.protocol === "http:") return new URL(url.origin);
    } catch { /* nilai tidak valid: pakai cadangan */ }
  }
  return new URL("http://localhost:3000");
}

export const SITE_NAME = "Stallion Store";
// Gambar bagikan (Open Graph) default: banner hero yang sudah ada, tidak diubah.
export const DEFAULT_SHARE_IMAGE = "/images/sampul/hero-bg.webp";
