package com.backend.domain.chat.repository;

import com.backend.domain.chat.entity.ChatRequest;
import com.backend.domain.chat.type.ChatRequestStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatRequestRepository extends JpaRepository<ChatRequest, String> {

    boolean existsByRequester_IdAndReceiver_IdAndPost_IdAndStatus(String requesterId,
                                                                  String receiverId,
                                                                  String postId,
                                                                  ChatRequestStatus status);

    boolean existsByRequester_IdAndReceiver_IdAndPostIsNullAndStatus(String requesterId,
                                                                     String receiverId,
                                                                     ChatRequestStatus status);

    List<ChatRequest> findByReceiver_IdAndStatusOrderByCreatedAtDesc(String receiverId,
                                                                     ChatRequestStatus status);

}
