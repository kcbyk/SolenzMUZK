CREATE TABLE IF NOT EXISTS downloads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  video_id         VARCHAR(50) NOT NULL,
  title            VARCHAR(500) NOT NULL,
  channel_name     VARCHAR(255) NOT NULL,
  duration_sec     INTEGER NOT NULL,
  thumbnail_url    VARCHAR(500),
  format           VARCHAR(10) NOT NULL CHECK (format IN ('mp3', 'aac', 'mp4')),
  quality          VARCHAR(20) NOT NULL,
  file_path        VARCHAR(1000) NOT NULL DEFAULT '',
  file_size_bytes  BIGINT NOT NULL DEFAULT 0,
  status           VARCHAR(20) NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','downloading','completed','failed','paused')),
  progress_pct     INTEGER NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  bytes_downloaded BIGINT NOT NULL DEFAULT 0,
  error_message    TEXT,
  started_at       TIMESTAMPTZ,
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downloads_user_id ON downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_downloads_status ON downloads(status);
