CREATE TABLE IF NOT EXISTS ai_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  google_sub TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  picture TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ai_users_email ON ai_users (email);

CREATE TABLE IF NOT EXISTS ai_wallets (
  user_id INTEGER PRIMARY KEY,
  balance_micros INTEGER NOT NULL DEFAULT 0,
  reserved_micros INTEGER NOT NULL DEFAULT 0,
  exact_usage_nanos INTEGER NOT NULL DEFAULT 0,
  billed_usage_micros INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE TABLE IF NOT EXISTS ai_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_sessions_user ON ai_sessions (user_id, expires_at);

CREATE TABLE IF NOT EXISTS ai_topup_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  package_id TEXT NOT NULL,
  amount_cents INTEGER NOT NULL,
  credits_micros INTEGER NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  credited_at TEXT,
  capture_id TEXT,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_topup_orders_user ON ai_topup_orders (user_id, created_at);

CREATE TABLE IF NOT EXISTS ai_topups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  order_id TEXT NOT NULL UNIQUE,
  capture_id TEXT UNIQUE,
  package_id TEXT NOT NULL,
  credits_micros INTEGER NOT NULL,
  gross_amount_cents INTEGER NOT NULL,
  paypal_fee_cents INTEGER,
  net_amount_cents INTEGER,
  currency TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_topups_user ON ai_topups (user_id, created_at);

CREATE TABLE IF NOT EXISTS ai_request_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  ip_hash TEXT,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_request_attempts_user_created
  ON ai_request_attempts (user_id, created_at);

CREATE TABLE IF NOT EXISTS ai_usage_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  client_request_id TEXT NOT NULL,
  provider_request_id TEXT UNIQUE,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  cost_usd_nanos INTEGER NOT NULL DEFAULT 0,
  exact_credits_nanos INTEGER NOT NULL DEFAULT 0,
  billed_credits_micros INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created
  ON ai_usage_ledger (user_id, created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ai_usage_user_client_request
  ON ai_usage_ledger (user_id, client_request_id);
