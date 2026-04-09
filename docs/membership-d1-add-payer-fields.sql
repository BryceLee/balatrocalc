ALTER TABLE memberships ADD COLUMN payer_email TEXT;
ALTER TABLE memberships ADD COLUMN payer_name TEXT;
ALTER TABLE memberships ADD COLUMN payer_id TEXT;

ALTER TABLE orders ADD COLUMN payer_email TEXT;
ALTER TABLE orders ADD COLUMN payer_name TEXT;
ALTER TABLE orders ADD COLUMN payer_id TEXT;

ALTER TABLE subscriptions ADD COLUMN payer_email TEXT;
ALTER TABLE subscriptions ADD COLUMN payer_name TEXT;
ALTER TABLE subscriptions ADD COLUMN payer_id TEXT;
