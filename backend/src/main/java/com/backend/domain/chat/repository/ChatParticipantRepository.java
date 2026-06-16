package com.backend.domain.chat.repository;

import com.backend.domain.chat.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, String> {
    List<ChatParticipant> findByUser_Id(String userId);
    boolean existsByChatRoom_IdAndUser_Id(String roomId, String userId);
    List<ChatParticipant> findByChatRoom_Id(String roomId);
}
