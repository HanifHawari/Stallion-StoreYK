import { NextResponse } from "next/server";
import { currentSessionTokenHash, getCurrentCustomer, hashPassword, isValidNewPassword, revokeCustomerSessions, verifyPassword } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { clearAttempts, isRateLimited, RATE_LIMIT_MESSAGE, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Pengaturan akun belum tersedia.", 503);
  try {
    const customer = await getCurrentCustomer();
    if (!customer) return jsonError("Silakan login terlebih dahulu.", 401);
    const body = await readJsonObject(request, 1024);
    const { currentPassword, newPassword } = body;
    if (typeof currentPassword !== "string" || !currentPassword || currentPassword.length > 128) return jsonError("Masukkan kata sandi saat ini.", 400);
    if (!isValidNewPassword(newPassword)) return jsonError("Kata sandi baru minimal 8 karakter.", 400);
    if (newPassword === currentPassword) return jsonError("Kata sandi baru harus berbeda dari kata sandi saat ini.", 400);
    const limitKey = `password:${customer.id}`;
    if (await isRateLimited(limitKey, 5, 900)) return jsonError(RATE_LIMIT_MESSAGE, 429);
    const stored = (await getPool().query<{ password_hash: string }>("SELECT password_hash FROM customers WHERE id = $1", [customer.id])).rows[0];
    if (!stored || !(await verifyPassword(currentPassword, stored.password_hash))) {
      await recordAttempt(limitKey);
      return jsonError("Kata sandi saat ini salah.", 400);
    }
    await getPool().query("UPDATE customers SET password_hash = $2 WHERE id = $1", [customer.id, await hashPassword(newPassword)]);
    await clearAttempts(limitKey);
    // Perangkat ini tetap login; sesi di perangkat lain dicabut.
    await revokeCustomerSessions(customer.id, await currentSessionTokenHash());
    return NextResponse.json({ message: "Kata sandi berhasil diubah. Perangkat lain sudah dikeluarkan dari akun." });
  } catch (error) {
    return errorResponse(error, "Kata sandi belum dapat diubah. Coba lagi nanti.");
  }
}
