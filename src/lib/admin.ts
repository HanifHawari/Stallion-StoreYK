import { notFound, redirect } from "next/navigation";
import { getCurrentAdmin, getCurrentCustomer, type CurrentCustomer } from "@/lib/auth";
import { RequestError } from "@/lib/http";

// Untuk halaman /admin: belum login → ke /login; login tapi bukan admin → 404 (tidak membuka keberadaan panel).
export async function requireAdminPage(path: string): Promise<CurrentCustomer> {
  if (!process.env.DATABASE_URL) notFound();
  const admin = await getCurrentAdmin();
  if (admin) return admin;
  if (!(await getCurrentCustomer())) redirect("/login?next=" + encodeURIComponent(path));
  notFound();
}

// Untuk /api/admin/*: melempar RequestError 401/403 yang diubah errorResponse() menjadi JSON.
export async function requireAdminApi(): Promise<CurrentCustomer> {
  if (!process.env.DATABASE_URL) throw new RequestError("Panel admin belum tersedia.", 503);
  const admin = await getCurrentAdmin();
  if (admin) return admin;
  if (!(await getCurrentCustomer())) throw new RequestError("Silakan login terlebih dahulu.", 401);
  throw new RequestError("Akses khusus admin.", 403);
}

// Pesanan lunas yang belum dikirim (dipakai dashboard & filter daftar pesanan).
export const TO_PROCESS_SQL = "status = 'paid' AND (fulfillment_status IS NULL OR fulfillment_status IN ('processing', 'packed'))";
