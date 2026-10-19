-- Produk draft (nonaktif) boleh belum punya harga; produk aktif wajib berharga.
ALTER TABLE products ALTER COLUMN price_idr DROP NOT NULL;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'products_active_requires_price') THEN
    ALTER TABLE products ADD CONSTRAINT products_active_requires_price CHECK (NOT active OR price_idr IS NOT NULL);
  END IF;
END $$;
