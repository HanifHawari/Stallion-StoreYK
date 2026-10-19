-- Berat & dimensi paket per produk (menggantikan SHIPPING_PACKAGES_JSON) dan waktu ubah terakhir.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS weight_grams integer CHECK (weight_grams > 0),
  ADD COLUMN IF NOT EXISTS length_cm numeric(6, 1) CHECK (length_cm > 0),
  ADD COLUMN IF NOT EXISTS width_cm numeric(6, 1) CHECK (width_cm > 0),
  ADD COLUMN IF NOT EXISTS height_cm numeric(6, 1) CHECK (height_cm > 0),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
