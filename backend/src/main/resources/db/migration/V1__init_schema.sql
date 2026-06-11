CREATE TABLE users (
                       id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                       social_id VARCHAR(255) NOT NULL,
                       provider VARCHAR(30) NOT NULL,
                       provider_email VARCHAR(255),

                       nickname VARCHAR(50) NOT NULL,
                       profile_image VARCHAR(500),

                       access_token TEXT NULL,
                       refresh_token TEXT NULL,
                       token_expires_at DATETIME NULL,

                       role ENUM('YOUTUBER', 'EDITOR', 'BOTH') NOT NULL,

                       manner_score INT NOT NULL DEFAULT 30,
                       match_enabled BOOLEAN NOT NULL DEFAULT FALSE,

                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                       CONSTRAINT uk_users_provider_social UNIQUE (provider, social_id)
);

CREATE TABLE portfolios (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                            user_id CHAR(36) NOT NULL,

                            title VARCHAR(100) NOT NULL,
                            thumbnail_url VARCHAR(500),
                            image_url VARCHAR(500),
                            description TEXT,

                            display_order INT NOT NULL DEFAULT 0,
                            is_representative BOOLEAN NOT NULL DEFAULT FALSE,

                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_portfolios_user
                                FOREIGN KEY (user_id) REFERENCES users(id)
                                    ON DELETE CASCADE
);

CREATE TABLE profiles (
                          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                          user_id CHAR(36) NOT NULL UNIQUE,

                          name VARCHAR(50),
                          phone VARCHAR(30),
                          bio TEXT,

                          public_status BOOLEAN NOT NULL DEFAULT TRUE,
                          representative_portfolio_id CHAR(36) NULL,

                          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                          CONSTRAINT fk_profiles_user
                              FOREIGN KEY (user_id) REFERENCES users(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_profiles_representative_portfolio
                              FOREIGN KEY (representative_portfolio_id) REFERENCES portfolios(id)
                                  ON DELETE SET NULL
);

CREATE TABLE user_tags (
                           id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                           user_id CHAR(36) NOT NULL,

                           tag_type ENUM('FIELD', 'TOOL', 'CONTENT_TYPE') NOT NULL,
                           tag_name VARCHAR(50) NOT NULL,

                           CONSTRAINT fk_user_tags_user
                               FOREIGN KEY (user_id) REFERENCES users(id)
                                   ON DELETE CASCADE,

                           CONSTRAINT uk_user_tags_user_type_name
                               UNIQUE (user_id, tag_type, tag_name)
);

CREATE TABLE posts (
                       id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                       author_id CHAR(36) NOT NULL,

                       board_type ENUM('JOB', 'COMMUNITY') NOT NULL,
                       post_type ENUM('REQUEST', 'JOB_OFFER') NULL,

                       category VARCHAR(50),
                       title VARCHAR(200) NOT NULL,
                       content LONGTEXT NOT NULL,

                       price INT NULL,
                       thumbnail_url VARCHAR(500) NULL,

                       view_count INT NOT NULL DEFAULT 0,
                       like_count INT NOT NULL DEFAULT 0,
                       chat_count INT NOT NULL DEFAULT 0,

                       created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                       CONSTRAINT fk_posts_author
                           FOREIGN KEY (author_id) REFERENCES users(id)
                               ON DELETE CASCADE
);

CREATE TABLE post_tags (
                           id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                           post_id CHAR(36) NOT NULL,
                           tag_name VARCHAR(50) NOT NULL,

                           CONSTRAINT fk_post_tags_post
                               FOREIGN KEY (post_id) REFERENCES posts(id)
                                   ON DELETE CASCADE,

                           CONSTRAINT uk_post_tags_post_name
                               UNIQUE (post_id, tag_name)
);

CREATE TABLE post_likes (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                            user_id CHAR(36) NOT NULL,
                            post_id CHAR(36) NOT NULL,

                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_post_likes_user
                                FOREIGN KEY (user_id) REFERENCES users(id)
                                    ON DELETE CASCADE,

                            CONSTRAINT fk_post_likes_post
                                FOREIGN KEY (post_id) REFERENCES posts(id)
                                    ON DELETE CASCADE,

                            CONSTRAINT uk_post_likes_user_post
                                UNIQUE (user_id, post_id)
);

CREATE TABLE comments (
                          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                          post_id CHAR(36) NOT NULL,
                          writer_id CHAR(36) NOT NULL,
                          parent_id CHAR(36) NULL,

                          content TEXT NOT NULL,

                          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                          CONSTRAINT fk_comments_post
                              FOREIGN KEY (post_id) REFERENCES posts(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_comments_writer
                              FOREIGN KEY (writer_id) REFERENCES users(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_comments_parent
                              FOREIGN KEY (parent_id) REFERENCES comments(id)
                                  ON DELETE CASCADE
);

CREATE TABLE chat_rooms (
                            id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                            room_type ENUM('DIRECT', 'PROJECT', 'POST') NOT NULL,

                            post_id CHAR(36) NULL,

                            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                            CONSTRAINT fk_chat_rooms_post
                                FOREIGN KEY (post_id) REFERENCES posts(id)
                                    ON DELETE SET NULL
);

CREATE TABLE chat_room_users (
                                 id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                                 room_id CHAR(36) NOT NULL,
                                 user_id CHAR(36) NOT NULL,

                                 unread_count INT NOT NULL DEFAULT 0,

                                 joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                 CONSTRAINT fk_chat_room_users_room
                                     FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT fk_chat_room_users_user
                                     FOREIGN KEY (user_id) REFERENCES users(id)
                                         ON DELETE CASCADE,

                                 CONSTRAINT uk_chat_room_users_room_user
                                     UNIQUE (room_id, user_id)
);

CREATE TABLE messages (
                          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                          room_id CHAR(36) NOT NULL,
                          sender_id CHAR(36) NOT NULL,

                          message_type ENUM('TEXT', 'SYSTEM', 'PROJECT_CARD') NOT NULL DEFAULT 'TEXT',
                          content TEXT NULL,

                          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                          CONSTRAINT fk_messages_room
                              FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_messages_sender
                              FOREIGN KEY (sender_id) REFERENCES users(id)
                                  ON DELETE CASCADE
);

CREATE TABLE match_requests (
                                id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                                requester_id CHAR(36) NOT NULL,
                                editor_id CHAR(36) NOT NULL,

                                status ENUM('WAITING', 'ACCEPTED', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'WAITING',

                                created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                                CONSTRAINT fk_match_requests_requester
                                    FOREIGN KEY (requester_id) REFERENCES users(id)
                                        ON DELETE CASCADE,

                                CONSTRAINT fk_match_requests_editor
                                    FOREIGN KEY (editor_id) REFERENCES users(id)
                                        ON DELETE CASCADE
);

CREATE TABLE projects (
                          id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                          room_id CHAR(36) NOT NULL,

                          requester_id CHAR(36) NOT NULL,
                          editor_id CHAR(36) NOT NULL,

                          field VARCHAR(50),
                          price INT,
                          video_length INT,
                          revision_count INT NOT NULL DEFAULT 0,
                          deadline DATETIME,

                          memo TEXT NULL,

                          status ENUM('WAITING', 'WORKING', 'COMPLETED', 'REJECTED', 'CANCELED') NOT NULL DEFAULT 'WAITING',

                          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

                          CONSTRAINT fk_projects_room
                              FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_projects_requester
                              FOREIGN KEY (requester_id) REFERENCES users(id)
                                  ON DELETE CASCADE,

                          CONSTRAINT fk_projects_editor
                              FOREIGN KEY (editor_id) REFERENCES users(id)
                                  ON DELETE CASCADE
);

CREATE TABLE reviews (
                         id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                         project_id CHAR(36) NOT NULL UNIQUE,

                         reviewer_id CHAR(36) NOT NULL,
                         target_user_id CHAR(36) NOT NULL,

                         rating DECIMAL(2,1) NOT NULL,
                         content TEXT NULL,
                         image_url VARCHAR(500) NULL,

                         created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                         CONSTRAINT fk_reviews_project
                             FOREIGN KEY (project_id) REFERENCES projects(id)
                                 ON DELETE CASCADE,

                         CONSTRAINT fk_reviews_reviewer
                             FOREIGN KEY (reviewer_id) REFERENCES users(id)
                                 ON DELETE CASCADE,

                         CONSTRAINT fk_reviews_target_user
                             FOREIGN KEY (target_user_id) REFERENCES users(id)
                                 ON DELETE CASCADE,

                         CONSTRAINT chk_reviews_rating
                             CHECK (rating >= 0 AND rating <= 5)
);

CREATE TABLE notifications (
                               id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                               receiver_id CHAR(36) NOT NULL,

                               type VARCHAR(50) NOT NULL,
                               reference_id CHAR(36) NULL,

                               is_read BOOLEAN NOT NULL DEFAULT FALSE,

                               created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                               CONSTRAINT fk_notifications_receiver
                                   FOREIGN KEY (receiver_id) REFERENCES users(id)
                                       ON DELETE CASCADE
);

CREATE TABLE price_statistics (
                                  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

                                  content_type ENUM('LONG_FORM', 'SHORT_FORM', 'REELS') NOT NULL,

                                  avg_price INT NOT NULL,
                                  calculated_date DATE NOT NULL,

                                  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

                                  CONSTRAINT uk_price_statistics_content_date
                                      UNIQUE (content_type, calculated_date)
);