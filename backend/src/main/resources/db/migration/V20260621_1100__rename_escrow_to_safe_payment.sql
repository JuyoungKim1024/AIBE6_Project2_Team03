-- users 테이블: escrow_point → safe_payment_point
ALTER TABLE users RENAME COLUMN escrow_point TO safe_payment_point;

-- point_transactions ENUM: 기존 값 + 신규 값 동시 허용
ALTER TABLE point_transactions
    MODIFY COLUMN type ENUM (
        'CHARGE',
        'ESCROW_HOLD', 'ESCROW_RELEASE', 'ESCROW_REFUND',
        'SAFE_PAYMENT_HOLD', 'SAFE_PAYMENT_RELEASE', 'SAFE_PAYMENT_REFUND',
        'DISPUTE_SETTLEMENT'
    ) NOT NULL;

-- 기존 데이터 → 새 값으로 변환
UPDATE point_transactions SET type = 'SAFE_PAYMENT_HOLD'    WHERE type = 'ESCROW_HOLD';
UPDATE point_transactions SET type = 'SAFE_PAYMENT_RELEASE' WHERE type = 'ESCROW_RELEASE';
UPDATE point_transactions SET type = 'SAFE_PAYMENT_REFUND'  WHERE type = 'ESCROW_REFUND';

-- 구 ENUM 값 제거
ALTER TABLE point_transactions
    MODIFY COLUMN type ENUM (
        'CHARGE',
        'SAFE_PAYMENT_HOLD', 'SAFE_PAYMENT_RELEASE', 'SAFE_PAYMENT_REFUND',
        'DISPUTE_SETTLEMENT'
    ) NOT NULL;
