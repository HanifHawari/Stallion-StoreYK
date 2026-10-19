import { getPool } from "@/lib/db";

export const RATE_LIMIT_MESSAGE = "Terlalu banyak percobaan. Silakan coba lagi beberapa saat lagi.";

// IP klien. x-real-ip diutamakan (diisi proxy/hosting), lalu entri TERAKHIR x-forwarded-for (entri awal bisa
// dipalsukan klien). `next start` sendiri mengisi x-forwarded-for dari alamat socket bila header kosong, tetapi
// tidak menimpa nilai kiriman klien — tanpa proxy tepercaya di depan aplikasi, IP ini bisa dipalsukan.
// Mengembalikan null jika tetap tidak ada (mis. runtime lain), agar batas per IP tidak memakai satu kunci bersama.
export function clientIp(request: Request): string | null {
  const realIp = request.headers.get("x-real-ip")?.trim();
  const forwarded = request.headers.get("x-forwarded-for")?.split(",").map((part) => part.trim()).filter(Boolean).at(-1);
  return (realIp || forwarded)?.slice(0, 64) || null;
}

// Kunci rate limit per IP; null (batas per IP dilewati) bila IP tidak diketahui — satu kunci bersama
// akan membuat 3 pendaftaran dari siapa pun memblokir pendaftaran seluruh situs.
export function ipKey(prefix: string, request: Request): string | null {
  const ip = clientIp(request);
  return ip ? `${prefix}:${ip}` : null;
}

export async function isAnyRateLimited(checks: [key: string | null, limit: number, windowSeconds: number][]): Promise<boolean> {
  for (const [key, limit, windowSeconds] of checks) if (key && await isRateLimited(key, limit, windowSeconds)) return true;
  return false;
}

export async function isRateLimited(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const result = await getPool().query<{ count: number }>(
    "SELECT COUNT(*)::integer AS count FROM auth_attempts WHERE key = $1 AND created_at > now() - ($2::integer * interval '1 second')",
    [key, windowSeconds],
  );
  return (result.rows[0]?.count ?? 0) >= limit;
}

export async function recordAttempt(...keys: (string | null)[]): Promise<void> {
  for (const key of keys) if (key) await getPool().query("INSERT INTO auth_attempts (key) VALUES ($1)", [key]);
  // Bersihkan catatan lama sesekali agar tabel tidak terus membesar.
  if (Math.random() < 0.02) await getPool().query("DELETE FROM auth_attempts WHERE created_at < now() - interval '1 day'");
}

export async function clearAttempts(key: string): Promise<void> {
  await getPool().query("DELETE FROM auth_attempts WHERE key = $1", [key]);
}
