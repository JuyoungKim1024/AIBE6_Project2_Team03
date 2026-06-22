CREATE TABLE notices (
    id CHAR(36) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_published BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE support_tickets (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    ticket_type VARCHAR(20) NOT NULL,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    target_url VARCHAR(500) NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'RECEIVED',
    admin_note TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_support_tickets_user
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
);

CREATE INDEX idx_notices_published_created
    ON notices(is_published, created_at);

CREATE INDEX idx_support_tickets_type_status
    ON support_tickets(ticket_type, status);
