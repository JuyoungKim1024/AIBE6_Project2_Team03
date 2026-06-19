DROP TABLE IF EXISTS job_post_portfolios;

CREATE TABLE job_post_portfolio_groups (
    post_id  CHAR(36) NOT NULL,
    group_id CHAR(36) NOT NULL,
    PRIMARY KEY (post_id, group_id),
    CONSTRAINT fk_jppg_post  FOREIGN KEY (post_id)  REFERENCES posts(id)             ON DELETE CASCADE,
    CONSTRAINT fk_jppg_group FOREIGN KEY (group_id) REFERENCES portfolio_groups(id)  ON DELETE CASCADE
);
