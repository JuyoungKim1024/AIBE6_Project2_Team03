package com.backend.domain.chat.repository;

import com.backend.domain.chat.entity.ChatMessage;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, String> {
    List<ChatMessage> findByChatRoom_IdOrderByCreatedAtAsc(String roomId);
    ChatMessage findTopByChatRoom_IdOrderByCreatedAtDesc(String roomId);

    @Query("SELECT m FROM ChatMessage m WHERE m.chatRoom.id = :roomId ORDER BY m.createdAt DESC")
    List<ChatMessage> findLastMessagesByRoomId(@Param("roomId") String roomId, Pageable pageable);
}
