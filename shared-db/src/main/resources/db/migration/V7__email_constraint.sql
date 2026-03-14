DELETE FROM person
WHERE email IS NULL;

ALTER TABLE person
    ALTER COLUMN email SET NOT NULL;

ALTER TABLE person
    ADD CONSTRAINT person_email_unique UNIQUE (email);