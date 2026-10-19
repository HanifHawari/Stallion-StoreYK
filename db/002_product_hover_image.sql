-- Optional second product photo for card hover. Apply after 001_init.sql.
ALTER TABLE products ADD COLUMN IF NOT EXISTS hover_image_url text;
