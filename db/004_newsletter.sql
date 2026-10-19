-- Apply after 003_auth.sql to enable member newsletter subscriptions.
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  email text PRIMARY KEY,
  customer_id text NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);
