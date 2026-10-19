// Menjadikan akun terdaftar sebagai admin (atau mencabutnya).
// Pemakaian: npm run admin:create -- email@contoh.com
//            npm run admin:create -- email@contoh.com --revoke
import { Client } from "pg";
import { requireDatabaseUrl } from "./env";

async function main() {
  const email = process.argv.slice(2).find((arg) => !arg.startsWith("--"))?.trim().toLowerCase();
  const revoke = process.argv.includes("--revoke");
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.error("Pemakaian: npm run admin:create -- email@contoh.com [--revoke]");
    process.exit(1);
  }
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  try {
    const result = await client.query<{ name: string }>("UPDATE customers SET role = $2 WHERE email = $1 RETURNING name", [email, revoke ? "customer" : "admin"]);
    if (!result.rowCount) {
      console.error(`Akun ${email} belum terdaftar. Daftar dulu lewat halaman /register, lalu jalankan perintah ini lagi.`);
      process.exit(1);
    }
    console.log(revoke ? `✓ Akses admin ${result.rows[0].name} (${email}) dicabut.` : `✓ ${result.rows[0].name} (${email}) sekarang admin. Buka /admin setelah login.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
