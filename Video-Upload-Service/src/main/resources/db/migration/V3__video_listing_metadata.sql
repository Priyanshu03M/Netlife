ALTER TABLE videos
    ADD COLUMN IF NOT EXISTS thumbnail_object_key TEXT,
    ADD COLUMN IF NOT EXISTS channel_name VARCHAR(255) NOT NULL DEFAULT 'unknown',
    ADD COLUMN IF NOT EXISTS views BIGINT NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_videos_status_created_at_id
    ON videos (status, created_at DESC, id DESC);
