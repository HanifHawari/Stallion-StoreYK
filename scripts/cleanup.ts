// Membersihkan data kedaluwarsa. Jalankan berkala (mis. cron tiap jam saat deploy).
// Pemakaian: npm run db:cleanup
// Pesanan "expired" tetap aman: jika pembayaran Midtrans tetap masuk, webhook menandainya lunas.
import { Client } from "pg";
import { requireDatabaseUrl } from "./env";

async function main() {
  const client = new Client({ connectionString: requireDatabaseUrl() });
  await client.connect();
  try {
    await client.query("BEGIN");
    const orders = await client.query("UPDATE orders SET status = 'expired' WHERE status = 'awaiting_payment' AND expires_at < now()");
    const sessions = await client.query("DELETE FROM customer_sessions WHERE expires_at < now()");
    const tokens = await client.query("DELETE FROM password_reset_tokens WHERE expires_at < now() - interval '1 day' OR used_at < now() - interval '1 day'");
    const attempts = await client.query("DELETE FROM auth_attempts WHERE created_at < now() - interval '1 day'");
    await client.query("COMMIT");
    console.log(`✓ ${orders.rowCount} pesanan lewat batas bayar → expired`);
    console.log(`✓ ${sessions.rowCount} sesi login kedaluwarsa dihapus`);
    console.log(`✓ ${tokens.rowCount} token atur ulang sandi lama dihapus`);
    console.log(`✓ ${attempts.rowCount} catatan percobaan login lama dihapus`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
