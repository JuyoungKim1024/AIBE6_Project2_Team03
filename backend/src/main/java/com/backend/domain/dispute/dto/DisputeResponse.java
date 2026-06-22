package com.backend.domain.dispute.dto;

import com.backend.domain.dispute.entity.Dispute;
import com.backend.domain.dispute.entity.DisputeStatus;
import com.backend.domain.dispute.entity.DisputeType;

import java.time.LocalDateTime;

public record DisputeResponse(
        String id,
        String projectId,
        String reportedById,
        DisputeType type,
        DisputeStatus status,
        String description,
        String aiJudgment,
        Integer finalAmount,
        Boolean requesterAccepted,
        Boolean editorAccepted,
        LocalDateTime createdAt
) {
    public static DisputeResponse from(Dispute dispute) {
        return new DisputeResponse(
                dispute.getId(),
                dispute.getProject().getId(),
                dispute.getReportedBy().getId(),
                dispute.getType(),
                dispute.getStatus(),
                dispute.getDescription(),
                dispute.getAiJudgment(),
                dispute.getFinalAmount(),
                dispute.getRequesterAccepted(),
                dispute.getEditorAccepted(),
                dispute.getCreatedAt()
        );
    }
}
