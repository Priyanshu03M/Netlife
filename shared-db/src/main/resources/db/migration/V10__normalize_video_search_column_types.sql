DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'videos'
          AND column_name = 'title'
          AND udt_name = 'bytea'
    ) THEN
        ALTER TABLE videos
            ALTER COLUMN title TYPE TEXT
            USING convert_from(title, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'videos'
          AND column_name = 'description'
          AND udt_name = 'bytea'
    ) THEN
        ALTER TABLE videos
            ALTER COLUMN description TYPE TEXT
            USING convert_from(description, 'UTF8');
    END IF;

    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'videos'
          AND column_name = 'channel_name'
          AND udt_name = 'bytea'
    ) THEN
        ALTER TABLE videos
            ALTER COLUMN channel_name TYPE VARCHAR(255)
            USING convert_from(channel_name, 'UTF8');
    END IF;
END $$;
