ALTER TABLE projects
    ADD COLUMN work_amount INT NULL,
    ADD COLUMN work_unit VARCHAR(20) NOT NULL DEFAULT 'MINUTE';

UPDATE projects
SET work_amount = video_length
WHERE video_length IS NOT NULL;

ALTER TABLE projects
    DROP COLUMN video_length;
