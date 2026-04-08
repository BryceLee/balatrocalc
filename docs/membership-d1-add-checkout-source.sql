ALTER TABLE memberships ADD COLUMN checkout_source TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE memberships ADD COLUMN checkout_source_meta TEXT;

ALTER TABLE orders ADD COLUMN checkout_source TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE orders ADD COLUMN checkout_source_meta TEXT;

ALTER TABLE subscriptions ADD COLUMN checkout_source TEXT NOT NULL DEFAULT 'unknown';
ALTER TABLE subscriptions ADD COLUMN checkout_source_meta TEXT;
