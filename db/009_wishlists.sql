-- Wishlist tersimpan di akun (sebelumnya localStorage per perangkat).
CREATE TABLE IF NOT EXISTS wishlists (
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  product_id text NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (customer_id, product_id)
);
