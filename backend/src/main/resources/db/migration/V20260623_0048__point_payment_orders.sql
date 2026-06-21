CREATE TABLE point_payment_orders (
    order_id VARCHAR(64) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    points INT NOT NULL,
    status VARCHAR(20) NOT NULL,
    payment_key VARCHAR(200) NULL,
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    approved_at DATETIME(6) NULL,
    CONSTRAINT uk_point_payment_orders_payment_key UNIQUE (payment_key),
    CONSTRAINT fk_point_payment_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_point_payment_orders_user_created
    ON point_payment_orders (user_id, created_at);
