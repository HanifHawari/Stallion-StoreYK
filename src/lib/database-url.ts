// Menyesuaikan connection string agar alamat bawaan penyedia database bisa langsung ditempel tanpa diedit.
// Neon (*.neon.tech): sertifikatnya tepercaya, jadi sslmode "require" dijadikan "verify-full" (perilaku driver `pg`
// sama, tanpa peringatan SSL), dan parameter channel_binding (khusus libpq) dibuang. Alamat lain tidak diubah.
function parse(raw: string): URL | null {
  try {
    const url = new URL(raw.trim());
    return url.protocol === "postgres:" || url.protocol === "postgresql:" ? url : null;
  } catch {
    return null;
  }
}

const isNeon = (url: URL) => url.hostname.endsWith(".neon.tech");

export function normalizeDatabaseUrl(raw: string): string {
  const url = parse(raw);
  if (!url || !isNeon(url)) return raw.trim();
  url.searchParams.delete("channel_binding");
  const mode = url.searchParams.get("sslmode");
  if (!mode || mode === "require" || mode === "prefer") url.searchParams.set("sslmode", "verify-full");
  return url.toString();
}

// Script migrasi/seed/admin memakai koneksi langsung, bukan pooler: migrasi mengunci lewat advisory lock yang
// hanya aman dalam satu sesi database. Neon: host "ep-xxx-pooler.region..." → "ep-xxx.region...".
export function directDatabaseUrl(raw: string): string {
  const normalized = normalizeDatabaseUrl(raw);
  const url = parse(normalized);
  if (!url || !isNeon(url)) return normalized;
  url.hostname = url.hostname.replace(/-pooler\./, ".");
  return url.toString();
}

// Untuk ditampilkan di terminal tanpa membocorkan kata sandi.
export function maskDatabaseUrl(raw: string): string {
  const url = parse(raw);
  if (!url) return "(alamat tidak valid)";
  if (url.password) url.password = "****";
  return url.toString();
}
