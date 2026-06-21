ALTER TABLE users
    ADD COLUMN suspended_until DATETIME(6) NULL,
    ADD COLUMN suspension_reason VARCHAR(255) NULL;

CREATE INDEX idx_users_suspended_until ON users (suspended_until);
