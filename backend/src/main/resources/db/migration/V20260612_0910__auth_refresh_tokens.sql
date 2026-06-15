CREATE TABLE auth_refresh_tokens (
                                     id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                                     user_id CHAR(36) NOT NULL,
                                     refresh_token VARCHAR(500) NOT NULL,
                                     expires_at DATETIME NOT NULL,
                                     revoked BOOLEAN NOT NULL DEFAULT FALSE,

                                     created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                     CONSTRAINT fk_auth_refresh_tokens_user
                                         FOREIGN KEY (user_id) REFERENCES users(id)
                                             ON DELETE CASCADE,

                                     CONSTRAINT uk_auth_refresh_tokens_token
                                         UNIQUE (refresh_token)
);

ALTER TABLE users
    MODIFY role ENUM('YOUTUBER', 'EDITOR', 'BOTH') NULL;
