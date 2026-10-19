import { getPool } from "@/lib/db";

// Apakah database bisa dihubungi? Dipakai root layout: jika tidak (mis. server database dijeda karena masa
// trial habis), seluruh situs menampilkan popup "Sedang maintenance" dan pulih sendiri saat database hidup lagi.
// Hasil disimpan sebentar agar tidak setiap request memeriksa database.
const CHECK_TIMEOUT_MS = 4000;
const REMEMBER_UP_MS = 15_000;
const REMEMBER_DOWN_MS = 10_000;

let last: { up: boolean; at: number } | null = null;
let running: Promise<boolean> | null = null;

async function check(): Promise<boolean> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      getPool().query("SELECT 1"),
      new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("Database tidak menjawab.")), CHECK_TIMEOUT_MS); }),
    ]);
    return true;
  } catch (error) {
    console.error("[health] Database tidak dapat dihubungi:", error instanceof Error ? error.message : error);
    return false;
  } finally {
    clearTimeout(timer);
  }
}

export async function isDatabaseAvailable(): Promise<boolean> {
  // Tanpa DATABASE_URL situs sengaja berjalan dalam mode pratinjau — bukan maintenance.
  if (!process.env.DATABASE_URL) return true;
  if (last && Date.now() - last.at < (last.up ? REMEMBER_UP_MS : REMEMBER_DOWN_MS)) return last.up;
  running ??= check().then((up) => { last = { up, at: Date.now() }; running = null; return up; });
  return running;
}

// Untuk test.
export function resetDatabaseHealth(): void {
  last = null;
  running = null;
}
