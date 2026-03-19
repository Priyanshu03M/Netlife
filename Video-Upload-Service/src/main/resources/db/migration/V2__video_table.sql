CREATE TABLE videos (
                        id VARCHAR(50) PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,

                        title VARCHAR(255) NOT NULL,
                        description TEXT,

                        bucket_url TEXT NOT NULL,
                        object_key TEXT NOT NULL,
                        duration INT CHECK (duration >= 0),
                        size BIGINT CHECK (size >= 0),

    format VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'UPLOADING',

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_videos_user
        FOREIGN KEY (user_id) REFERENCES person(id)
        ON DELETE CASCADE
);