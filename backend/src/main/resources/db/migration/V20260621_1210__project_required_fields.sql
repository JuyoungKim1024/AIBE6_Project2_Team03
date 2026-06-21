UPDATE projects
SET field = '미지정'
WHERE field IS NULL OR TRIM(field) = '';

UPDATE projects
SET price = 0
WHERE price IS NULL;

UPDATE projects
SET work_amount = 0
WHERE work_amount IS NULL;

UPDATE projects
SET work_unit = 'MINUTE'
WHERE work_unit IS NULL OR TRIM(work_unit) = '';

UPDATE projects
SET deadline = created_at
WHERE deadline IS NULL;

ALTER TABLE projects
    MODIFY COLUMN field VARCHAR(50) NOT NULL,
    MODIFY COLUMN price INT NOT NULL,
    MODIFY COLUMN work_amount INT NOT NULL,
    MODIFY COLUMN work_unit VARCHAR(20) NOT NULL,
    MODIFY COLUMN deadline DATETIME NOT NULL;
