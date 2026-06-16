-- match_price를 match_price_min으로 변경하고 match_price_max 추가
ALTER TABLE users CHANGE COLUMN match_price match_price_min INT NULL;
ALTER TABLE users ADD COLUMN match_price_max INT NULL AFTER match_price_min;
