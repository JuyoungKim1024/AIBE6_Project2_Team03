ALTER TABLE users
    ADD COLUMN password_hash VARCHAR(100) NULL,
    ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET email_verified = TRUE
WHERE provider IN ('GOOGLE', 'KAKAO');

CREATE UNIQUE INDEX uk_users_provider_email
    ON users(provider_email);

CREATE TABLE email_verifications (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(100) NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_email_verifications_email UNIQUE (email)
);
