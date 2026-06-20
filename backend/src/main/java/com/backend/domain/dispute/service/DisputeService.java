package com.backend.domain.dispute.service;

import com.backend.domain.dispute.dto.DisputeCreateRequest;
import com.backend.domain.dispute.dto.DisputeRespondRequest;
import com.backend.domain.dispute.dto.DisputeResponse;
import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.entity.DisputeStatus;
import com.backend.domain.dispute.repository.DisputeRepository;
import com.backend.domain.point.service.PointService;
import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.repository.ProjectRepository;
import com.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ProjectRepository projectRepository;
    private final PointService pointService;
    private final DisputeJudgeService judgeService;

    @Transactional
    public DisputeResponse createDispute(String userId, DisputeCreateRequest request) {
        Project project = projectRepository.findByIdWithParticipants(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));

        String requesterId = project.getRequester().getId();
        String editorId = project.getEditor().getId();
        if (!userId.equals(requesterId) && !userId.equals(editorId)) {
            throw new IllegalArgumentException("프로젝트 참여자만 분쟁을 신고할 수 있습니다.");
        }

        if (project.getStatus() != ProjectStatus.WORKING
                && project.getStatus() != ProjectStatus.COMPLETION_PENDING) {
            throw new IllegalArgumentException("진행 중인 프로젝트에서만 분쟁을 신고할 수 있습니다.");
        }

        boolean hasActiveDispute = disputeRepository.existsByProject_IdAndStatusIn(
                request.projectId(),
                List.of(DisputeStatus.AI_PENDING, DisputeStatus.AI_JUDGED)
        );
        if (hasActiveDispute) {
            throw new IllegalStateException("이미 진행 중인 분쟁이 있습니다.");
        }

        User reportedBy = userId.equals(requesterId) ? project.getRequester() : project.getEditor();

        Dispute dispute = new Dispute(project, reportedBy, request.type(), request.description());
        disputeRepository.save(dispute);

        // @Async 쓰레드가 커밋 전 findById를 호출하는 race condition 방지
        String disputeId = dispute.getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                judgeService.judgeAsync(disputeId);
            }
        });

        return DisputeResponse.from(dispute);
    }

    public DisputeResponse getDispute(String userId, String disputeId) {
        Dispute dispute = findAndValidateParticipant(disputeId, userId);
        return DisputeResponse.from(dispute);
    }

    @Transactional
    public DisputeResponse respond(String userId, String disputeId, DisputeRespondRequest request) {
        Dispute dispute = findAndValidateParticipant(disputeId, userId);

        if (dispute.getStatus() != DisputeStatus.AI_JUDGED) {
            throw new IllegalStateException("AI 판정이 완료된 후에 응답할 수 있습니다.");
        }

        dispute.respond(userId, request.accepted());

        if (dispute.getStatus() == DisputeStatus.ACCEPTED) {
            pointService.settleDispute(dispute.getProject(), dispute.getFinalAmount());
        }

        return DisputeResponse.from(dispute);
    }

    private Dispute findAndValidateParticipant(String disputeId, String userId) {
        Dispute dispute = disputeRepository.findByIdWithDetails(disputeId)
                .orElseThrow(() -> new IllegalArgumentException("분쟁을 찾을 수 없습니다."));

        String requesterId = dispute.getProject().getRequester().getId();
        String editorId = dispute.getProject().getEditor().getId();
        if (!userId.equals(requesterId) && !userId.equals(editorId)) {
            throw new IllegalArgumentException("프로젝트 참여자만 접근할 수 있습니다.");
        }
        return dispute;
    }
}
