ALTER TABLE profiles
    ADD COLUMN public_posts_visible BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN public_liked_posts_visible BOOLEAN NOT NULL DEFAULT FALSE;
