// Memuat .env.local untuk script CLI. Variabel yang sudah ada di environment tidak ditimpa.
import { directDatabaseUrl } from "../src/lib/database-url";

export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try { process.loadEnvFile(file); } catch { /* File tidak ada: abaikan. */ }
  }
}

// Alamat database untuk script (migrasi, seed, admin): koneksi langsung, walau .env.local berisi alamat pooler.
export function requireDatabaseUrl(): string {
  loadLocalEnv();
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("DATABASE_URL belum diisi. Jalankan: npm run db:setup -- \"<connection string>\"");
    process.exit(1);
  }
  return directDatabaseUrl(url);
}
