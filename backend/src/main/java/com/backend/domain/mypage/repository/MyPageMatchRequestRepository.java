package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPageMatchRequestRepository extends JpaRepository<MatchRequest, String> {
    List<MatchRequest> findByEditor_IdAndStatusOrderByCreatedAtDesc(String editorId, MatchRequestStatus status);
    boolean existsByRequester_IdAndEditor_IdAndStatus(String requesterId, String editorId, MatchRequestStatus status);
}
