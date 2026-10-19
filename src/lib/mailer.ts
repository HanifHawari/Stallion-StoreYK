// Pengiriman email lewat driver yang bisa diganti (MAIL_DRIVER).
// Driver "console" (default) hanya menulis email ke log server — untuk development sebelum
// provider email (Resend/SMTP) dipasang.
export type Mail = { to: string; subject: string; text: string; html: string };

export async function sendMail(mail: Mail): Promise<void> {
  const driver = process.env.MAIL_DRIVER?.trim() || "console";
  if (driver === "console") {
    if (process.env.NODE_ENV === "production") console.warn("[mailer] MAIL_DRIVER=console di production: email tidak benar-benar dikirim.");
    console.info(`[mailer/console] Kepada: ${mail.to}\nSubjek: ${mail.subject}\n\n${mail.text}\n`);
    return;
  }
  throw new Error(`MAIL_DRIVER "${driver}" belum didukung.`);
}

// URL publik situs untuk tautan di email. Di production wajib PUBLIC_SITE_URL agar tautan tidak
// bisa dibelokkan lewat header Host palsu (password reset poisoning).
export function publicSiteUrl(request: Request): URL {
  const configured = process.env.PUBLIC_SITE_URL?.trim();
  if (configured) {
    const url = new URL(configured);
    if (url.protocol === "https:" || url.protocol === "http:") return url;
  }
  if (process.env.NODE_ENV === "production") throw new Error("PUBLIC_SITE_URL belum dikonfigurasi.");
  return new URL(new URL(request.url).origin);
}

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char);
}
