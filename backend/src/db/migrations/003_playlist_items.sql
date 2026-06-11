CREATE TABLE IF NOT EXISTS playlist_items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id   UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id      VARCHAR(50) NOT NULL,
  title         VARCHAR(500) NOT NULL,
  channel_name  VARCHAR(255) NOT NULL,
  duration_sec  INTEGER NOT NULL,
  thumbnail_url VARCHAR(500),
  position      INTEGER NOT NULL,
  added_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON playlist_items(playlist_id);
