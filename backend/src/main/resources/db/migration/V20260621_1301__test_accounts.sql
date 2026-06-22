ALTER TABLE users
    ADD COLUMN is_test_account BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX idx_users_test_account_role
    ON users(is_test_account, role);
