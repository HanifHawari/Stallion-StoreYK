import { NextResponse } from "next/server";
import { clearCustomerSession, getCurrentCustomer, revokeCustomerSessions } from "@/lib/auth";
import { errorResponse, jsonError } from "@/lib/http";

export const runtime = "nodejs";

// Keluar dari semua perangkat, termasuk perangkat ini.
export async function DELETE() {
  if (!process.env.DATABASE_URL) return jsonError("Pengaturan akun belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    await revokeCustomerSessions(customer.id);
    await clearCustomerSession();
    return NextResponse.json({ message: "Kamu sudah keluar dari semua perangkat." });
  } catch (error) {
    return errorResponse(error, "Belum dapat keluar dari semua perangkat. Coba lagi nanti.");
  }
}
