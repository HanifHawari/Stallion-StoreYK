// Menjalankan db/*.sql berurutan. File yang sudah tercatat di schema_migrations dilewati.
// Pemakaian: npm run db:migrate
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";
import { requireDatabaseUrl } from "./env";

const MIGRATIONS_DIR = path.join(process.cwd(), "db");
const LOCK_ID = 74210931; // Kunci advisory agar dua proses migrasi tidak berjalan bersamaan.

async function main() {
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  try {
    await client.query("SELECT pg_advisory_lock($1)", [LOCK_ID]);
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        filename text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);
    const applied = new Set((await client.query<{ filename: string }>("SELECT filename FROM schema_migrations")).rows.map((row) => row.filename));
    const files = (await readdir(MIGRATIONS_DIR)).filter((name) => /^\d{3}_[a-z0-9_]+\.sql$/.test(name)).sort();
    let count = 0;
    for (const file of files) {
      if (applied.has(file)) continue;
      const sql = (await readFile(path.join(MIGRATIONS_DIR, file), "utf8")).replace(/^﻿/, "");
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [file]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw new Error(`Migrasi ${file} gagal: ${error instanceof Error ? error.message : String(error)}`);
      }
      console.log(`✓ ${file}`);
      count++;
    }
    console.log(count ? `${count} migrasi diterapkan.` : "Database sudah versi terbaru.");
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [LOCK_ID]).catch(() => undefined);
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
