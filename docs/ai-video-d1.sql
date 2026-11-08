-- Apply to preview and production DB bindings before enabling AI Video.
CREATE TABLE IF NOT EXISTS ai_video_jobs (
  id TEXT PRIMARY KEY,
  owner TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  scene TEXT NOT NULL CHECK (scene IN ('dance', 'rap')),
  duration INTEGER NOT NULL CHECK (duration IN (6, 10)),
  resolution TEXT NOT NULL CHECK (resolution IN ('480P', '720P')),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('9:16', '16:9')),
  prompt TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('preparing','submitting','queued','generating','uncertain','saving','completed','failed')),
  provider_id TEXT,
  photo_key TEXT NOT NULL,
  video_key TEXT,
  error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  poll_after INTEGER NOT NULL DEFAULT 0,
  UNIQUE (owner, idempotency_key)
);
CREATE UNIQUE INDEX IF NOT EXISTS ai_video_one_active
  ON ai_video_jobs(owner)
  WHERE status IN ('preparing','submitting','queued','generating','uncertain','saving');
CREATE INDEX IF NOT EXISTS ai_video_owner_created ON ai_video_jobs(owner, created_at DESC);
