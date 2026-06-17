CREATE TABLE IF NOT EXISTS post_likes (
    id CHAR(36) NOT NULL PRIMARY KEY,
    post_id CHAR(36) NOT NULL,
    user_id CHAR(36) NOT NULL,
    UNIQUE KEY uq_post_user (post_id, user_id),
    CONSTRAINT fk_postlike_post FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT fk_postlike_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
