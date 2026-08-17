CREATE TABLE IF NOT EXISTS ai_purchase_consents (
  order_id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  terms_version TEXT NOT NULL,
  accepted_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES ai_users(id),
  FOREIGN KEY (order_id) REFERENCES ai_topup_orders(order_id)
);

CREATE TABLE IF NOT EXISTS ai_payment_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id TEXT NOT NULL UNIQUE,
  provider_case_id TEXT,
  user_id INTEGER NOT NULL,
  capture_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount_cents INTEGER,
  credits_delta_micros INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  applied_at TEXT,
  FOREIGN KEY (user_id) REFERENCES ai_users(id)
);

CREATE INDEX IF NOT EXISTS idx_ai_payment_adjustments_capture
  ON ai_payment_adjustments (capture_id, applied_at);

CREATE INDEX IF NOT EXISTS idx_ai_payment_adjustments_case
  ON ai_payment_adjustments (provider_case_id, applied_at);
