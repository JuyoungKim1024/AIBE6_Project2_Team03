-- 테스트 유저
INSERT INTO users (id, social_id, provider, nickname, role, manner_score, match_enabled)
VALUES ('aaaaaaaa-0000-0000-0000-000000000001', 'test_social_001', 'KAKAO', '테스트유저', 'EDITOR', 30, false);

-- 게시글
INSERT INTO posts (id, author_id, board_type, post_type, title, content, min_price, max_price, price_visible)
VALUES
  ('bbbbbbbb-0001-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'JOB', 'JOB_SEARCH',  '편집 경력 3년 에디터 구직합니다', '유튜브 채널 편집 전문입니다. 장편/숏폼 모두 가능합니다.', 300000, 500000, true),
  ('bbbbbbbb-0002-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'JOB', 'JOB_SEARCH',  '브이로그 전문 편집자 구직', '감성 브이로그 편집 특기입니다. 색보정 포함 가능합니다.', 200000, 350000, false),
  ('bbbbbbbb-0003-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'JOB', 'RECRUITING',  '숏폼 편집자 구인합니다', '릴스/쇼츠 전문 편집자 구합니다. 주 2회 납품 가능하신 분.', 300000, 500000, true),
  ('bbbbbbbb-0004-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'COMMUNITY', NULL,    '편집 툴 추천 받아요', '프리미어 말고 다른 툴 써보신 분 있나요?', NULL, NULL, true),
  ('bbbbbbbb-0005-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001', 'COMMUNITY', NULL,    '숏폼 편집 팁 공유합니다', '제가 쓰는 숏폼 편집 워크플로우 공유해요.', NULL, NULL, true);

-- 커뮤니티 카테고리
UPDATE posts SET category = 'FREE' WHERE id = 'bbbbbbbb-0004-0000-0000-000000000001';
UPDATE posts SET category = 'INFO' WHERE id = 'bbbbbbbb-0005-0000-0000-000000000001';

-- 태그
INSERT INTO post_tags (id, post_id, tag_type, tag_name)
VALUES
  (UUID(), 'bbbbbbbb-0001-0000-0000-000000000001', 'FIELD', '롱폼'),
  (UUID(), 'bbbbbbbb-0001-0000-0000-000000000001', 'TOOL',  'Premiere Pro'),
  (UUID(), 'bbbbbbbb-0002-0000-0000-000000000001', 'FIELD', '브이로그'),
  (UUID(), 'bbbbbbbb-0002-0000-0000-000000000001', 'TOOL',  'Final Cut'),
  (UUID(), 'bbbbbbbb-0003-0000-0000-000000000001', 'FIELD', '숏폼'),
  (UUID(), 'bbbbbbbb-0003-0000-0000-000000000001', 'TOOL',  'After Effects'),
  (UUID(), 'bbbbbbbb-0004-0000-0000-000000000001', 'GENERAL', '편집'),
  (UUID(), 'bbbbbbbb-0005-0000-0000-000000000001', 'GENERAL', '숏폼');
