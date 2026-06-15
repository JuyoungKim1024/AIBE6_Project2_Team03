package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ChatRoomRepository extends JpaRepository<ChatRoom, String> {
}
