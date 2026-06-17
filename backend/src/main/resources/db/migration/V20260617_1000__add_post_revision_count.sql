ALTER TABLE posts
    ADD COLUMN revision_count INT NOT NULL DEFAULT 0 AFTER chat_count;
