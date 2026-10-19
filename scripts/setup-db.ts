// Menyiapkan database baru (mis. Neon) dalam satu perintah:
//   npm run db:setup -- "postgresql://user:password@host/neondb?sslmode=require"
// 1) cek koneksi, 2) simpan alamat ke .env.local (baris lama dinonaktifkan), 3) buat tabel (migrasi), 4) isi katalog.
// Tanpa argumen: memakai DATABASE_URL yang sudah ada di .env.local. Aman dijalankan ulang (tidak menimpa data).
import { spawn } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { Client } from "pg";
import { directDatabaseUrl, maskDatabaseUrl, normalizeDatabaseUrl } from "../src/lib/database-url";
import { loadLocalEnv } from "./env";

const envFile = process.argv.find((arg) => arg.startsWith("--env-file="))?.slice("--env-file=".length) || ".env.local";

function fail(message: string): never {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

// Simpan DATABASE_URL baru; baris lama tetap ada sebagai komentar agar mudah dikembalikan.
function saveDatabaseUrl(url: string) {
  const lines = existsSync(envFile) ? readFileSync(envFile, "utf8").split(/\r?\n/) : [];
  const stamp = new Date().toISOString().slice(0, 10);
  const next = lines.map((line) => /^\s*DATABASE_URL\s*=/.test(line) && line.trim() !== `DATABASE_URL=${url}` ? `# DATABASE_URL lama (dinonaktifkan db:setup ${stamp}): ${line.replace(/^\s*DATABASE_URL\s*=\s*/, "")}` : line);
  if (!next.some((line) => line.trim() === `DATABASE_URL=${url}`)) {
    while (next.length && next[next.length - 1] === "") next.pop();
    next.push(`DATABASE_URL=${url}`, "");
  }
  writeFileSync(envFile, next.join("\n"));
}

function run(script: string, url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--import", "tsx", script], { env: { ...process.env, DATABASE_URL: url }, stdio: "inherit" });
    child.once("error", reject);
    child.once("exit", (code) => code === 0 ? resolve() : reject(new Error(`${script} gagal (kode ${code}).`)));
  });
}

async function main() {
  const fromArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  if (!fromArg) loadLocalEnv();
  const raw = (fromArg ?? process.env.DATABASE_URL ?? "").trim().replace(/^["']|["']$/g, "");
  if (!raw) fail("Tempel connection string dari dashboard database, contoh:\n  npm run db:setup -- \"postgresql://user:password@host/neondb?sslmode=require\"");
  if (!/^postgres(ql)?:\/\//.test(raw)) fail("Alamat harus diawali postgresql:// (salin \"Connection string\" dari dashboard database).");

  const appUrl = normalizeDatabaseUrl(raw);
  const scriptUrl = directDatabaseUrl(raw);
  console.log(`Database: ${maskDatabaseUrl(appUrl)}`);

  console.log("\n1/4 Mengecek koneksi...");
  const client = new Client({ connectionString: scriptUrl, connectionTimeoutMillis: 15000 });
  try {
    await client.connect();
    const { rows: [info] } = await client.query<{ version: string; db: string }>("SELECT split_part(version(), ' on ', 1) AS version, current_database() AS db");
    console.log(`    ✓ Terhubung ke ${info.version}, database "${info.db}".`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const hint = /password|authentication/i.test(message) ? "Kata sandi/username salah — salin ulang connection string dari dashboard."
      : /ENOTFOUND|getaddrinfo/i.test(message) ? "Alamat server tidak ditemukan — periksa koneksi internet atau salin ulang alamatnya."
      : /timeout|ECONNREFUSED|ETIMEDOUT/i.test(message) ? "Server tidak menjawab — pastikan project database aktif dan internet tersambung."
      : "Periksa kembali connection string-nya.";
    fail(`Tidak dapat terhubung: ${message}\n  ${hint}`);
  } finally {
    await client.end().catch(() => undefined);
  }

  console.log(`\n2/4 Menyimpan alamat ke ${envFile}...`);
  saveDatabaseUrl(appUrl);
  console.log(`    ✓ DATABASE_URL disimpan (website memakai alamat ini; script otomatis memakai koneksi langsung).`);

  console.log("\n3/4 Membuat/memperbarui tabel...");
  await run("scripts/migrate.ts", scriptUrl);

  console.log("\n4/4 Mengisi katalog produk (produk yang sudah ada tidak ditimpa)...");
  await run("scripts/seed.ts", scriptUrl);

  console.log(`
✓ Database siap. Langkah berikutnya:
  1. Matikan lalu jalankan ulang: npm run dev
  2. Daftar akun Anda di http://localhost:3000/register
  3. Jadikan admin: npm run admin:create -- email-anda@contoh.com
  4. Buka /admin untuk mengisi harga & stok produk.
  Di hosting: isi env DATABASE_URL dengan nilai yang sama seperti di ${envFile}.`);
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
