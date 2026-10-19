import { createHash, randomBytes, randomUUID, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getPool } from "@/lib/db";

const scrypt = promisify(scryptCallback);
const SESSION_COOKIE = "stallion_session";
const SESSION_SECONDS = 60 * 60 * 24 * 30;

export type CurrentCustomer = { id: string; name: string; email: string };

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derived = await scrypt(password, salt, 64) as Buffer;
  return "scrypt:" + salt + ":" + derived.toString("hex");
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [algorithm, salt, expectedHex] = stored.split(":");
  if (algorithm !== "scrypt" || !/^[a-f0-9]{32}$/.test(salt ?? "") || !/^[a-f0-9]{128}$/.test(expectedHex ?? "")) return false;
  const expected = Buffer.from(expectedHex, "hex");
  const actual = await scrypt(password, salt, expected.length) as Buffer;
  return timingSafeEqual(actual, expected);
}

export function newCustomerId(): string { return randomUUID(); }

export async function getCurrentCustomer(): Promise<CurrentCustomer | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await getPool().query<CurrentCustomer>(
    "SELECT c.id, c.name, c.email FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = $1 AND s.expires_at > now()",
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export async function createCustomerSession(customerId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  await getPool().query(
    "INSERT INTO customer_sessions (token_hash, customer_id, expires_at) VALUES ($1, $2, now() + interval '30 days')",
    [tokenHash, customerId],
  );
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === "production",
    sameSite: "lax", path: "/", maxAge: SESSION_SECONDS,
  });
}

// Akun yang sedang login hanya jika berperan admin (migrasi 011). Terpisah dari getCurrentCustomer
// agar halaman toko tidak bergantung pada kolom role.
export async function getCurrentAdmin(): Promise<CurrentCustomer | null> {
  if (!process.env.DATABASE_URL) return null;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const result = await getPool().query<CurrentCustomer>(
    "SELECT c.id, c.name, c.email FROM customer_sessions s JOIN customers c ON c.id = s.customer_id WHERE s.token_hash = $1 AND s.expires_at > now() AND c.role = 'admin'",
    [tokenHash],
  );
  return result.rows[0] ?? null;
}

export function isValidNewPassword(password: unknown): password is string {
  return typeof password === "string" && password.length >= 8 && password.length <= 128;
}

// Hash token sesi browser ini (untuk mempertahankan sesi saat mencabut sesi lain).
export async function currentSessionTokenHash(): Promise<string | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? createHash("sha256").update(token).digest("hex") : null;
}

export async function revokeCustomerSessions(customerId: string, keepTokenHash: string | null = null): Promise<void> {
  await getPool().query(
    "DELETE FROM customer_sessions WHERE customer_id = $1 AND ($2::text IS NULL OR token_hash <> $2)",
    [customerId, keepTokenHash],
  );
}

export async function clearCustomerSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token && process.env.DATABASE_URL) {
    const tokenHash = createHash("sha256").update(token).digest("hex");
    await getPool().query("DELETE FROM customer_sessions WHERE token_hash = $1", [tokenHash]);
  }
  jar.delete(SESSION_COOKIE);
}

