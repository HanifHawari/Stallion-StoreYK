-- Jejak audit setiap perubahan stok yang dilakukan admin.
CREATE TABLE IF NOT EXISTS stock_movements (
  id text PRIMARY KEY,
  variant_id text NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  stock_after integer NOT NULL CHECK (stock_after >= 0),
  reason text NOT NULL,
  admin_id text REFERENCES customers(id) ON DELETE SET NULL,
  order_id text REFERENCES orders(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS stock_movements_variant_idx ON stock_movements (variant_id, created_at DESC);
