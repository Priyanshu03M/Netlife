CREATE TABLE IF NOT EXISTS videos (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    processed_path VARCHAR(512),
    object_key VARCHAR(512) NOT NULL,
    views BIGINT NOT NULL DEFAULT 0,
    size BIGINT,
    duration INTEGER,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_videos_user_id ON videos (user_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos (status);
