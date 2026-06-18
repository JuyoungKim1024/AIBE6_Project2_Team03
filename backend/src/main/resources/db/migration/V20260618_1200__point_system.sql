-- users 테이블에 포인트 컬럼 추가
ALTER TABLE users
    ADD COLUMN point INT NOT NULL DEFAULT 0,
    ADD COLUMN escrow_point INT NOT NULL DEFAULT 0;

-- match_requests 테이블에 합의 금액 컬럼 추가
ALTER TABLE match_requests
    ADD COLUMN agreed_amount INT NULL;

-- 포인트 거래 내역 테이블 생성
CREATE TABLE point_transactions (
    id VARCHAR(36) NOT NULL PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    amount INT NOT NULL,
    type VARCHAR(30) NOT NULL,
    description VARCHAR(100),
    match_request_id VARCHAR(36),
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    CONSTRAINT fk_point_tx_user FOREIGN KEY (user_id) REFERENCES users(id)
);
