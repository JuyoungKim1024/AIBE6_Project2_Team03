CREATE TABLE portfolio_groups (
    id CHAR(36) PRIMARY KEY,
    user_id CHAR(36) NOT NULL,
    name VARCHAR(50) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_representative BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT fk_portfolio_groups_user
        FOREIGN KEY (user_id) REFERENCES users(id)
            ON DELETE CASCADE
);

ALTER TABLE portfolios
    ADD COLUMN group_id CHAR(36) NULL,
    ADD CONSTRAINT fk_portfolios_group
        FOREIGN KEY (group_id) REFERENCES portfolio_groups(id)
            ON DELETE SET NULL;

CREATE INDEX idx_portfolio_groups_user_order
    ON portfolio_groups(user_id, display_order);

CREATE INDEX idx_portfolios_group_order
    ON portfolios(group_id, display_order);
