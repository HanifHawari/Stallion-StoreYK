-- Catatan percobaan login/daftar/lupa kata sandi untuk rate limiting.
CREATE TABLE IF NOT EXISTS auth_attempts (
  key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS auth_attempts_key_created_idx ON auth_attempts (key, created_at);
