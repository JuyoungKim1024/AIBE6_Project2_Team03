CREATE TABLE project_notifications (
    id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    recipient_id CHAR(36) NOT NULL,
    actor_id CHAR(36) NOT NULL,
    project_id CHAR(36) NOT NULL,
    type VARCHAR(40) NOT NULL,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_project_notifications_recipient FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_notifications_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_project_notifications_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_project_notifications_recipient_created
    ON project_notifications (recipient_id, created_at);
