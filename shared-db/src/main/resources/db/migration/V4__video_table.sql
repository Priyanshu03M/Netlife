CREATE TABLE videos (
                        id VARCHAR(50) PRIMARY KEY,
                        user_id VARCHAR(50) NOT NULL,
                        title TEXT NOT NULL,
                        description TEXT,
                        processed_path TEXT,
                        object_key TEXT NOT NULL,
                        views BIGINT NOT NULL,
                        size BIGINT CHECK (size >= 0),
                        duration INT CHECK (duration >= 0),
                        status VARCHAR(50) NOT NULL,
                        created_at TIMESTAMP,
                        updated_at TIMESTAMP,
                        err_message TEXT,

    CONSTRAINT fk_videos_user
        FOREIGN KEY (user_id) REFERENCES person(id)
        ON DELETE CASCADE
);