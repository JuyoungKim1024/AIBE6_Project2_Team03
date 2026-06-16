INSERT INTO users (
    id, social_id, provider, provider_email, nickname, role
)
VALUES
    ('user-1', 'social-1', 'KAKAO', 'user1@test.com', '유저1', 'YOUTUBER'),
    ('user-2', 'social-2', 'KAKAO', 'user2@test.com', '유저2', 'EDITOR');

INSERT INTO chat_rooms (id, room_type, post_id)
VALUES
    ('room-1', 'DIRECT', NULL);

INSERT INTO chat_room_users (room_id, user_id)
VALUES
    ('room-1', 'user-1'),
    ('room-1', 'user-2');

INSERT INTO messages (room_id, sender_id, message_type, content)
VALUES
    ('room-1', 'user-1', 'TEXT', '안녕하세요'),
    ('room-1', 'user-2', 'TEXT', '반갑습니다');