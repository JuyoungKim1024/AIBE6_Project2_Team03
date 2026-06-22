package com.backend.domain.dispute.dto;

import com.backend.domain.dispute.entity.Dispute;

import java.time.format.DateTimeFormatter;

public record DisputeNotificationResponse(
        String id,
        String type,
        String status,
        String senderName,
        String senderAvatar,
        String chatRoomId,
        String createdAt
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static DisputeNotificationResponse from(Dispute dispute) {
        return new DisputeNotificationResponse(
                dispute.getId(),
                "DISPUTE_FILED",
                "PENDING",
                dispute.getReportedBy().getNickname(),
                dispute.getReportedBy().getProfileImage(),
                dispute.getProject().getRoom().getId(),
                dispute.getCreatedAt() != null ? dispute.getCreatedAt().format(FORMATTER) : null
        );
    }
}
