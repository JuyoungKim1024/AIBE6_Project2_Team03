-- add: posts.portfolio_id (구직 글 포트폴리오 선택, nullable)
ALTER TABLE posts
    ADD COLUMN portfolio_id CHAR(36) NULL AFTER price,
    ADD CONSTRAINT fk_posts_portfolio
        FOREIGN KEY (portfolio_id) REFERENCES portfolios(id)
            ON DELETE SET NULL;

-- alter: posts.category VARCHAR → ENUM('INFO', 'FREE')
ALTER TABLE posts
    MODIFY COLUMN category ENUM('INFO', 'FREE') NULL;

-- add: post_tags.tag_type (구인/구직: FIELD/TOOL, 커뮤니티: GENERAL)
ALTER TABLE post_tags
    ADD COLUMN tag_type ENUM('FIELD', 'TOOL', 'GENERAL') NOT NULL DEFAULT 'GENERAL' AFTER post_id;

-- alter: post_tags unique constraint (post_id + tag_type + tag_name)
ALTER TABLE post_tags
    DROP INDEX uk_post_tags_post_name,
    ADD CONSTRAINT uk_post_tags_post_type_name
        UNIQUE (post_id, tag_type, tag_name);
