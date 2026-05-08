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
