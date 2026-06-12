ALTER TABLE users
    ADD COLUMN match_price INT NULL,
    ADD COLUMN match_price_unit ENUM('MIN', 'CASE') NULL;
