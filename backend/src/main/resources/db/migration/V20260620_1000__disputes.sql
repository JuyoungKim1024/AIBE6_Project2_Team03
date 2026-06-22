CREATE TABLE disputes
(
    id                 CHAR(36)     NOT NULL PRIMARY KEY,
    project_id         CHAR(36)     NOT NULL,
    reported_by        CHAR(36)     NOT NULL,
    type               VARCHAR(20)  NOT NULL,
    status             VARCHAR(20)  NOT NULL DEFAULT 'AI_PENDING',
    description        TEXT,
    ai_judgment        TEXT,
    final_amount       INT          NULL,
    requester_accepted TINYINT(1)   NULL,
    editor_accepted    TINYINT(1)   NULL,
    created_at         DATETIME(6)  NOT NULL,
    updated_at         DATETIME(6)  NOT NULL,
    CONSTRAINT fk_dispute_project FOREIGN KEY (project_id) REFERENCES projects (id),
    CONSTRAINT fk_dispute_user FOREIGN KEY (reported_by) REFERENCES users (id)
);

ALTER TABLE point_transactions
    MODIFY COLUMN type ENUM ('CHARGE','ESCROW_HOLD','ESCROW_RELEASE','ESCROW_REFUND','DISPUTE_SETTLEMENT') NOT NULL;
