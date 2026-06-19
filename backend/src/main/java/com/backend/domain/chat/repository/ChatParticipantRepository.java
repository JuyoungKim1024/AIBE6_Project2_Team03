package com.backend.domain.chat.repository;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, String> {
    List<ChatParticipant> findByUser_Id(String userId);
    Optional<ChatParticipant> findByChatRoom_IdAndUser_Id(String roomId, String userId);
    boolean existsByChatRoom_IdAndUser_Id(String roomId, String userId);
    List<ChatParticipant> findByChatRoom_Id(String roomId);
    List<ChatParticipant> findByUser_IdAndDeletedAtIsNull(String userId);

    @Query("""
            SELECT participant.chatRoom
            FROM ChatParticipant participant
            WHERE participant.chatRoom.chatRoomType =  com.backend.domain.chat.type.ChatRoomType.DIRECT
                AND participant.chatRoom.id IN (
                    SELECT p1.chatRoom.id
                    FROM ChatParticipant p1
                    WHERE p1.user.id = :userId1
                )
                AND participant.chatRoom.id IN (
                    SELECT p2.chatRoom.id
                    FROM ChatParticipant p2
                    WHERE p2.user.id = :userId2
                )
            GROUP BY participant.chatRoom
            HAVING COUNT(participant.id) = 2
            """)
    Optional<ChatRoom> findDirectRoomByUserIds(String userId1, String userId2);

    @Query("""
            SELECT participant.chatRoom
            FROM ChatParticipant participant
            WHERE participant.chatRoom.chatRoomType = com.backend.domain.chat.type.ChatRoomType.POST
                AND participant.chatRoom.post.id = :postId
                AND participant.chatRoom.id IN (
                    SELECT p1.chatRoom.id
                    FROM ChatParticipant p1
                    WHERE p1.user.id = :userId1
                )
                AND participant.chatRoom.id IN (
                    SELECT p2.chatRoom.id
                    FROM ChatParticipant p2
                    WHERE p2.user.id = :userId2
                )
            GROUP BY participant.chatRoom
            HAVING COUNT(participant.id) = 2
            """)
    Optional<ChatRoom> findPostRoomByPostIdAndUserIds(String postId, String userId1, String userId2);

}
