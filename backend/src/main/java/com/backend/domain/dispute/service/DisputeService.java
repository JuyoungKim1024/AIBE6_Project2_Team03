package com.backend.domain.dispute.service;

import com.backend.domain.dispute.dto.DisputeCreateRequest;
import com.backend.domain.dispute.dto.DisputeNotificationResponse;
import com.backend.domain.dispute.dto.DisputeResponse;
import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.entity.DisputeStatus;
import com.backend.domain.dispute.repository.DisputeRepository;
import com.backend.domain.point.service.PointService;
import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DisputeService {

    private static final List<DisputeStatus> ACTIVE_STATUSES =
            List.of(DisputeStatus.AI_PENDING, DisputeStatus.AI_JUDGED, DisputeStatus.AI_FAILED);

    public record DisputeCreateResult(DisputeResponse dispute, boolean isNew) {}

    private final DisputeRepository disputeRepository;
    private final ProjectRepository projectRepository;
    private final PointService pointService;
    private final DisputeJudgeService judgeService;

    @Transactional
    public DisputeCreateResult createDispute(String userId, DisputeCreateRequest request) {
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

        // 이미 진행 중인 분쟁이 있으면 기존 분쟁 반환 (프론트에서 결과 모달로 바로 열 수 있도록)
        List<Dispute> existingDisputes = disputeRepository.findActiveByProjectId(project.getId(), ACTIVE_STATUSES);
        if (!existingDisputes.isEmpty()) {
            return new DisputeCreateResult(DisputeResponse.from(existingDisputes.get(0)), false);
        }

        var reportedBy = userId.equals(requesterId) ? project.getRequester() : project.getEditor();

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

        return new DisputeCreateResult(DisputeResponse.from(dispute), true);
    }

    public List<DisputeNotificationResponse> getDisputeNotifications(String userId) {
        return disputeRepository.findActiveDisputesReportedByOther(userId, ACTIVE_STATUSES)
                .stream()
                .map(DisputeNotificationResponse::from)
                .toList();
    }

    public Optional<DisputeResponse> getActiveDisputeByProject(String userId, String projectId) {
        return disputeRepository.findActiveByProjectId(projectId, ACTIVE_STATUSES)
                .stream()
                .filter(d -> {
                    String requesterId = d.getProject().getRequester().getId();
                    String editorId = d.getProject().getEditor().getId();
                    return userId.equals(requesterId) || userId.equals(editorId);
                })
                .findFirst()
                .map(DisputeResponse::from);
    }

    public DisputeResponse getDispute(String userId, String disputeId) {
        Dispute dispute = findAndValidateParticipant(disputeId, userId);
        return DisputeResponse.from(dispute);
    }

    @Transactional
    public DisputeResponse accept(String userId, String disputeId) {
        Dispute dispute = findAndValidateParticipant(disputeId, userId);
        dispute.accept(userId);

        if (dispute.getStatus() == DisputeStatus.ACCEPTED) {
            Integer finalAmount = dispute.getFinalAmount();
            if (finalAmount == null || finalAmount < 0) {
                throw new IllegalStateException("정산 금액이 유효하지 않습니다.");
            }
            pointService.settleDispute(dispute.getProject(), finalAmount);
            dispute.getProject().completeByDispute();
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
