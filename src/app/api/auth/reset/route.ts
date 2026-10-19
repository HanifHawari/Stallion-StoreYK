import { createHash } from "node:crypto";
import type { PoolClient } from "pg";
import { NextResponse } from "next/server";
import { hashPassword, isValidNewPassword } from "@/lib/auth";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";

export const runtime = "nodejs";

const INVALID_LINK = "Tautan atur ulang tidak valid atau sudah kedaluwarsa. Minta tautan baru.";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Fitur atur ulang kata sandi belum tersedia.", 503);
  let client: PoolClient | undefined;
  try {
    const body = await readJsonObject(request, 1024);
    const token = typeof body.token === "string" ? body.token : "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return jsonError(INVALID_LINK, 400);
    if (!isValidNewPassword(body.password)) return jsonError("Kata sandi baru minimal 8 karakter.", 400);
    const passwordHash = await hashPassword(body.password);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    client = await getPool().connect();
    await client.query("BEGIN");
    const row = (await client.query<{ customer_id: string }>(
      "SELECT customer_id FROM password_reset_tokens WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now() FOR UPDATE",
      [tokenHash],
    )).rows[0];
    if (!row) {
      await client.query("ROLLBACK");
      return jsonError(INVALID_LINK, 400);
    }
    await client.query("UPDATE customers SET password_hash = $2 WHERE id = $1", [row.customer_id, passwordHash]);
    await client.query("UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1", [tokenHash]);
    await client.query("DELETE FROM password_reset_tokens WHERE customer_id = $1 AND token_hash <> $2", [row.customer_id, tokenHash]);
    // Keluarkan semua perangkat: siapa pun yang memegang sesi lama harus login ulang.
    await client.query("DELETE FROM customer_sessions WHERE customer_id = $1", [row.customer_id]);
    await client.query("COMMIT");
    return NextResponse.json({ message: "Kata sandi berhasil diubah. Silakan login dengan kata sandi baru." });
  } catch (error) {
    await client?.query("ROLLBACK").catch(() => undefined);
    return errorResponse(error, "Kata sandi belum dapat diubah. Coba lagi nanti.");
  } finally {
    client?.release();
  }
}
