-- Apply this additive schema to a dedicated Stallion Store PostgreSQL database.
CREATE TABLE IF NOT EXISTS products (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  brand text NOT NULL,
  category text NOT NULL CHECK (category IN ('Basketball', 'Running', 'Lifestyle')),
  color text NOT NULL,
  image_url text NOT NULL,
  description text NOT NULL DEFAULT '',
  price_idr integer NOT NULL CHECK (price_idr > 0),
  compare_at_idr integer CHECK (compare_at_idr > price_idr),
  badge text,
  active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS product_variants (
  id text PRIMARY KEY,
  product_id text NOT NULL REFERENCES products(id),
  size_eu text NOT NULL,
  size_value numeric(4, 1) NOT NULL,
  sku text NOT NULL UNIQUE,
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  UNIQUE (product_id, size_eu)
);

CREATE TABLE IF NOT EXISTS orders (
  id text PRIMARY KEY,
  customer_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text NOT NULL,
  shipping_address text NOT NULL,
  shipping_city text NOT NULL,
  shipping_postal_code text NOT NULL,
  subtotal_idr integer NOT NULL CHECK (subtotal_idr > 0),
  shipping_idr integer NOT NULL CHECK (shipping_idr >= 0),
  total_idr integer NOT NULL CHECK (total_idr = subtotal_idr + shipping_idr),
  status text NOT NULL CHECK (status IN (
    'awaiting_payment', 'paid', 'failed', 'expired', 'cancelled',
    'payment_setup_failed', 'stock_issue'
  )),
  payment_url text,
  expires_at timestamptz NOT NULL,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS order_items (
  id text PRIMARY KEY,
  order_id text NOT NULL REFERENCES orders(id),
  variant_id text NOT NULL REFERENCES product_variants(id),
  product_name text NOT NULL,
  size_eu text NOT NULL,
  image_url text NOT NULL,
  unit_price_idr integer NOT NULL CHECK (unit_price_idr > 0),
  quantity integer NOT NULL CHECK (quantity > 0)
);

CREATE INDEX IF NOT EXISTS order_items_variant_idx ON order_items (variant_id);
CREATE INDEX IF NOT EXISTS orders_reservation_idx ON orders (status, expires_at);
