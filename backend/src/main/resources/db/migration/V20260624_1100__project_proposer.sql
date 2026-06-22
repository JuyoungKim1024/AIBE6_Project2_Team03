ALTER TABLE projects
    ADD COLUMN proposed_by_id CHAR(36) NULL AFTER editor_id;

UPDATE projects
SET proposed_by_id = requester_id
WHERE proposed_by_id IS NULL;

ALTER TABLE projects
    MODIFY proposed_by_id CHAR(36) NOT NULL,
    ADD CONSTRAINT fk_projects_proposed_by
        FOREIGN KEY (proposed_by_id) REFERENCES users(id);
