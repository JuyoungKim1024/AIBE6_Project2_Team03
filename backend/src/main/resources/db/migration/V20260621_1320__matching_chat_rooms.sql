ALTER TABLE chat_rooms
    MODIFY COLUMN room_type ENUM('DIRECT', 'PROJECT', 'POST', 'MATCHING') NOT NULL,
    ADD COLUMN match_request_id CHAR(36) NULL,
    ADD CONSTRAINT uk_chat_rooms_match_request UNIQUE (match_request_id),
    ADD CONSTRAINT fk_chat_rooms_match_request
        FOREIGN KEY (match_request_id) REFERENCES match_requests(id) ON DELETE SET NULL;
