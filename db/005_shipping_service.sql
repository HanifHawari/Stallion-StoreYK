-- Preserve the selected courier and service alongside the quoted shipping fee.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS shipping_courier_code text,
  ADD COLUMN IF NOT EXISTS shipping_service_code text;
