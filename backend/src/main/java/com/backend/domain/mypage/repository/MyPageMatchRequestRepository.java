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

    // 크리에이터(requester)에게 보여줄 수락/거절 알림 (editor 정보 포함)
    @Query("SELECT m FROM MatchRequest m JOIN FETCH m.editor WHERE m.requester.id = :requesterId AND m.status IN :statuses AND m.requesterNotifDismissedAt IS NULL ORDER BY m.createdAt DESC")
    List<MatchRequest> findByRequester_IdAndStatusInAndRequesterNotifDismissedAtIsNullOrderByCreatedAtDesc(
            @Param("requesterId") String requesterId,
            @Param("statuses") List<MatchRequestStatus> statuses
    );

    boolean existsByRequester_IdAndEditor_IdAndStatus(String requesterId, String editorId, MatchRequestStatus status);
}
