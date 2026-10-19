-- Peran akun: pelanggan biasa atau admin toko. Admin dibuat lewat: npm run admin:create -- <email>
ALTER TABLE customers ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'customer';
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_role_check') THEN
    ALTER TABLE customers ADD CONSTRAINT customers_role_check CHECK (role IN ('customer', 'admin'));
  END IF;
END $$;
