CREATE TABLE job_post_portfolios (
    post_id      CHAR(36) NOT NULL,
    portfolio_id CHAR(36) NOT NULL,
    PRIMARY KEY (post_id, portfolio_id),
    CONSTRAINT fk_jpp_post      FOREIGN KEY (post_id)      REFERENCES posts(id)      ON DELETE CASCADE,
    CONSTRAINT fk_jpp_portfolio FOREIGN KEY (portfolio_id) REFERENCES portfolios(id) ON DELETE CASCADE
);
