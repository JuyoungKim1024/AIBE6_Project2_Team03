ALTER TABLE profiles
    ADD COLUMN public_job_posts_visible BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN public_community_posts_visible BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE posts
    ADD COLUMN public_visible BOOLEAN NOT NULL DEFAULT FALSE;
