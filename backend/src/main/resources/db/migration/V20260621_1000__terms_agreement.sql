ALTER TABLE users
    ADD COLUMN terms_agreed_at DATETIME NULL;

UPDATE users
SET terms_agreed_at = CURRENT_TIMESTAMP
WHERE deleted_at IS NULL;
