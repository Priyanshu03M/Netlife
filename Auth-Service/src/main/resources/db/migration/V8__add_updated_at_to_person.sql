ALTER TABLE person ADD COLUMN updated_at TIMESTAMP;

UPDATE person
SET updated_at = created_at
WHERE updated_at IS NULL;
