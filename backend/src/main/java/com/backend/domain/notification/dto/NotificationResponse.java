package com.backend.domain.notification.dto;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;

import java.time.format.DateTimeFormatter;

public record NotificationResponse(
        String id,
        String type,
        String status,
        String senderName,
        String senderAvatar,
        String matchingId,
        String chatRoomId,
        String createdAt
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ISO_LOCAL_DATE_TIME;

    public static NotificationResponse from(MatchRequest request) {
        return from(request, null);
    }

    public static NotificationResponse from(MatchRequest request, String chatRoomId) {
        return new NotificationResponse(
                request.getId(),
                "MATCHING_REQUEST",
                toFrontendStatus(request.getStatus()),
                request.getRequester().getNickname(),
                request.getRequester().getProfileImage(),
                request.getId(),
                chatRoomId,
                request.getCreatedAt() != null ? request.getCreatedAt().format(FORMATTER) : null
        );
    }

    private static String toFrontendStatus(MatchRequestStatus status) {
        return switch (status) {
            case WAITING -> "PENDING";
            case ACCEPTED -> "ACCEPTED";
            case REJECTED -> "REJECTED";
            case CANCELED -> "REJECTED";
        };
    }
}
