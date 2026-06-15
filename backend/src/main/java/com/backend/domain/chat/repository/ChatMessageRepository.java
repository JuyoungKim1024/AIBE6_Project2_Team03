package com.backend.domain.chat.repository;

import com.backend.domain.chat.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    Optional<ChatMessage> findByChatRoomIdOrderByCreatedAtAsc(String roomId);
}
