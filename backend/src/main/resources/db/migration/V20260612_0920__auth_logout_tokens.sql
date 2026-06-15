CREATE TABLE auth_logout_tokens (
                                    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                                    access_token VARCHAR(500) NOT NULL,
                                    expires_at DATETIME NOT NULL,
                                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                    CONSTRAINT uk_auth_logout_tokens_token
                                        UNIQUE (access_token)
);
