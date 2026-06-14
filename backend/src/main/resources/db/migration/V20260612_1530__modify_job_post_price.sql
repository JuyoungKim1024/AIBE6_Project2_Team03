ALTER TABLE posts
    DROP COLUMN price,
    ADD COLUMN min_price INT NULL AFTER content,
    ADD COLUMN max_price INT NULL AFTER min_price,
    ADD COLUMN price_visible BOOLEAN NOT NULL DEFAULT TRUE AFTER max_price;
