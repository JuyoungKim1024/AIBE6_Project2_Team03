package com.backend.domain.dispute.repository;

import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {

    // 프로젝트에 진행 중인 분쟁이 있는지 확인 (중복 신고 방지)
    boolean existsByProject_IdAndStatusIn(String projectId, List<DisputeStatus> statuses);

    // project(requester, editor) + reportedBy 한 번에 조회 (N+1 방지)
    @Query("SELECT d FROM Dispute d JOIN FETCH d.project p JOIN FETCH p.requester JOIN FETCH p.editor JOIN FETCH p.room JOIN FETCH d.reportedBy WHERE d.id = :id")
    Optional<Dispute> findByIdWithDetails(@Param("id") String id);

    // 프로젝트의 활성 분쟁 조회 (AI_PENDING 또는 AI_JUDGED)
    @Query("SELECT d FROM Dispute d JOIN FETCH d.project p JOIN FETCH p.requester JOIN FETCH p.editor JOIN FETCH d.reportedBy WHERE p.id = :projectId AND d.status IN ('AI_PENDING', 'AI_JUDGED')")
    Optional<Dispute> findActiveByProjectId(@Param("projectId") String projectId);

    // 내가 참여한 프로젝트의 진행 중인 분쟁 목록 (내가 신고하지 않은 것 = 상대방이 신고한 것)
    @Query("""
        SELECT d FROM Dispute d
        JOIN FETCH d.project p
        JOIN FETCH p.requester
        JOIN FETCH p.editor
        JOIN FETCH p.room
        JOIN FETCH d.reportedBy
        WHERE d.status IN ('AI_PENDING', 'AI_JUDGED')
        AND d.reportedBy.id != :userId
        AND (p.requester.id = :userId OR p.editor.id = :userId)
        ORDER BY d.createdAt DESC
        """)
    List<Dispute> findActiveDisputesReportedByOther(@Param("userId") String userId);
}
