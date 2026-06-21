package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MyPageMatchRequestRepository extends JpaRepository<MatchRequest, String> {

    @Query("SELECT m FROM MatchRequest m JOIN FETCH m.requester WHERE m.editor.id = :editorId AND m.status = :status ORDER BY m.createdAt DESC")
    List<MatchRequest> findByEditor_IdAndStatusOrderByCreatedAtDesc(@Param("editorId") String editorId, @Param("status") MatchRequestStatus status);

    List<MatchRequest> findByEditor_IdAndStatusAndNotificationDismissedAtIsNullOrderByCreatedAtDesc(
            String editorId,
            MatchRequestStatus status
    );

    boolean existsByRequester_IdAndEditor_IdAndStatus(String requesterId, String editorId, MatchRequestStatus status);
}
