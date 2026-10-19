import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getPool } from "@/lib/db";
import { errorResponse, jsonError, readJsonObject } from "@/lib/http";
import { escapeHtml, publicSiteUrl, sendMail } from "@/lib/mailer";
import { ipKey, isAnyRateLimited, RATE_LIMIT_MESSAGE, recordAttempt } from "@/lib/rate-limit";

export const runtime = "nodejs";

const RESET_MINUTES = 30;
const GENERIC_MESSAGE = "Jika email terdaftar, tautan untuk mengatur ulang kata sandi sudah dikirim. Periksa kotak masuk atau folder spam.";

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return jsonError("Fitur lupa kata sandi belum tersedia.", 503);
  try {
    const body = await readJsonObject(request, 1024);
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonError("Masukkan email yang valid.", 400);
    const limitIpKey = ipKey("forgot", request);
    const emailKey = `forgot-email:${email}`;
    if (await isAnyRateLimited([[limitIpKey, 3, 3600], [emailKey, 3, 3600]])) return jsonError(RATE_LIMIT_MESSAGE, 429);
    await recordAttempt(limitIpKey, emailKey);
    const siteUrl = publicSiteUrl(request);
    const customer = (await getPool().query<{ id: string; name: string }>("SELECT id, name FROM customers WHERE email = $1", [email])).rows[0];
    if (customer) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      // Hanya tautan terbaru yang berlaku.
      await getPool().query("DELETE FROM password_reset_tokens WHERE customer_id = $1", [customer.id]);
      await getPool().query(
        "INSERT INTO password_reset_tokens (token_hash, customer_id, expires_at) VALUES ($1, $2, now() + ($3::integer * interval '1 minute'))",
        [tokenHash, customer.id, RESET_MINUTES],
      );
      const link = new URL(`/reset-password?token=${token}`, siteUrl).toString();
      await sendMail({
        to: email,
        subject: "Atur ulang kata sandi Stallion Store",
        text: `Halo ${customer.name},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Stallion Store kamu. Buka tautan berikut dalam ${RESET_MINUTES} menit:\n\n${link}\n\nJika kamu tidak meminta ini, abaikan email ini. Kata sandi kamu tidak akan berubah.\n\nStallion Store`,
        html: `<p>Halo ${escapeHtml(customer.name)},</p><p>Kami menerima permintaan untuk mengatur ulang kata sandi akun Stallion Store kamu. Tautan berlaku ${RESET_MINUTES} menit:</p><p><a href="${escapeHtml(link)}">Atur ulang kata sandi</a></p><p>Jika kamu tidak meminta ini, abaikan email ini. Kata sandi kamu tidak akan berubah.</p><p>Stallion Store</p>`,
      });
    }
    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    return errorResponse(error, "Permintaan belum dapat diproses. Coba lagi nanti.");
  }
}
