import { requireAdminApi } from "@/lib/admin";
import { getPool } from "@/lib/db";
import { errorResponse } from "@/lib/http";

export const runtime = "nodejs";

// Sel CSV yang diawali = + - @ bisa dieksekusi sebagai rumus oleh Excel; diberi awalan ' agar aman.
function cell(value: string): string {
  const safe = /^[=+\-@\t\r]/.test(value) ? "'" + value : value;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    await requireAdminApi();
    const rows = (await getPool().query<{ email: string; name: string | null; subscribed_at: Date }>(`
      SELECT n.email, c.name, n.subscribed_at FROM newsletter_subscribers n LEFT JOIN customers c ON c.id = n.customer_id ORDER BY n.subscribed_at DESC
    `)).rows;
    const lines = [["email", "nama", "berlangganan_sejak"].join(","), ...rows.map((row) => [cell(row.email), cell(row.name ?? ""), cell(row.subscribed_at.toISOString())].join(","))];
    const date = new Date().toISOString().slice(0, 10);
    // BOM agar Excel membaca UTF-8 dengan benar.
    return new Response("﻿" + lines.join("\r\n") + "\r\n", {
      headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="newsletter-stallion-store-${date}.csv"`, "Cache-Control": "no-store" },
    });
  } catch (error) {
    return errorResponse(error, "Data newsletter belum dapat diunduh.");
  }
}
