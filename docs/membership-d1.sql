CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  txn_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_memberships_email_feature_created
  ON memberships (email, feature_key, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_order_id
  ON orders (order_id);

CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  feature_key TEXT NOT NULL,
  plan TEXT NOT NULL,
  provider TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_payment_at TEXT,
  next_billing_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email_feature
  ON subscriptions (email, feature_key);

CREATE INDEX IF NOT EXISTS idx_subscriptions_id
  ON subscriptions (subscription_id);
