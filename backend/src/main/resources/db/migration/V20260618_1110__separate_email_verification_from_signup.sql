ALTER TABLE email_verifications
    MODIFY password_hash VARCHAR(100) NULL,
    ADD COLUMN signup_token_hash VARCHAR(100) NULL,
    ADD COLUMN verified_at DATETIME NULL;
