ALTER TABLE match_requests
    ADD COLUMN notification_dismissed_at DATETIME NULL;

ALTER TABLE chat_requests
    ADD COLUMN notification_dismissed_at DATETIME NULL;
