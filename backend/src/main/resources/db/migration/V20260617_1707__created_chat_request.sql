CREATE TABLE chat_requests (
      id CHAR(36) PRIMARY KEY DEFAULT (UUID()),

      requester_id CHAR(36) NOT NULL,
      receiver_id CHAR(36) NOT NULL,
      post_id CHAR(36) NOT NULL,

      message TEXT NOT NULL,
      status ENUM('WAITING', 'ACCEPTED', 'REJECTED') NOT NULL DEFAULT 'WAITING',

      room_id CHAR(36) NULL,

      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      CONSTRAINT fk_chat_requests_requester
          FOREIGN KEY (requester_id) REFERENCES users(id)
          ON DELETE CASCADE,

      CONSTRAINT fk_chat_requests_receiver
          FOREIGN KEY (receiver_id) REFERENCES users(id)
          ON DELETE CASCADE,

      CONSTRAINT fk_chat_requests_post
          FOREIGN KEY (post_id) REFERENCES posts(id)
          ON DELETE CASCADE,

      CONSTRAINT fk_chat_requests_room
          FOREIGN KEY (room_id) REFERENCES chat_rooms(id)
          ON DELETE SET NULL
  );