package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.Message;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPageMessageRepository extends JpaRepository<Message, String> {
    Optional<Message> findTopByRoom_IdOrderByCreatedAtDesc(String roomId);
}
