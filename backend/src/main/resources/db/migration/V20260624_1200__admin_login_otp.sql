CREATE TABLE admin_login_otps (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    code_hash VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    attempt_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uk_admin_login_otps_user UNIQUE (user_id),
    CONSTRAINT fk_admin_login_otps_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
);
