package com.backend.domain.dispute.repository;

import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.entity.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, String> {

    // 프로젝트에 진행 중인 분쟁이 있는지 확인 (중복 신고 방지)
    boolean existsByProject_IdAndStatusIn(String projectId, List<DisputeStatus> statuses);

    // 분쟁 ID + 프로젝트 참여자 확인용
    Optional<Dispute> findByIdAndProject_Requester_IdOrIdAndProject_Editor_Id(
            String id1, String requesterId,
            String id2, String editorId
    );
}
