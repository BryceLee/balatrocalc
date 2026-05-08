CREATE TABLE IF NOT EXISTS memberships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  payer_email TEXT,
  payer_name TEXT,
  payer_id TEXT,
  feature_key TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL,
  provider TEXT NOT NULL,
  txn_id TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  checkout_source TEXT NOT NULL DEFAULT 'unknown',
  checkout_source_meta TEXT
);

CREATE INDEX IF NOT EXISTS idx_memberships_email_feature_created
  ON memberships (email, feature_key, created_at);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  payer_email TEXT,
  payer_name TEXT,
  payer_id TEXT,
  feature_key TEXT NOT NULL,
  order_id TEXT NOT NULL,
  plan TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  checkout_source TEXT NOT NULL DEFAULT 'unknown',
  checkout_source_meta TEXT
);



CREATE TABLE IF NOT EXISTS subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  payer_email TEXT,
  payer_name TEXT,
  payer_id TEXT,
  feature_key TEXT NOT NULL,
  plan TEXT NOT NULL,
  provider TEXT NOT NULL,
  subscription_id TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_payment_at TEXT,
  next_billing_at TEXT,
  checkout_source TEXT NOT NULL DEFAULT 'unknown',
  checkout_source_meta TEXT
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email_feature
  ON subscriptions (email, feature_key);

CREATE INDEX IF NOT EXISTS idx_subscriptions_id
  ON subscriptions (subscription_id);

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  anonymous_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  email TEXT,
  feature_key TEXT NOT NULL DEFAULT 'seed',
  subscription_status TEXT NOT NULL DEFAULT 'unknown',
  event_name TEXT NOT NULL,
  properties_json TEXT,
  path TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created
  ON analytics_events (created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_created
  ON analytics_events (event_name, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_email_created
  ON analytics_events (email, created_at);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created
  ON analytics_events (session_id, created_at);
