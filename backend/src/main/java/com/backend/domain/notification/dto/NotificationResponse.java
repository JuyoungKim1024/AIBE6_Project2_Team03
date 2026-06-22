package com.backend.domain.notification.dto;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.notification.entity.ProjectNotification;

import java.time.format.DateTimeFormatter;

public record NotificationResponse(
        String id,
        String type,
        String status,
        String senderName,
        String senderAvatar,
        String chatRoomId,
        String message,
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
                chatRoomId,
                null,
                request.getCreatedAt() != null ? request.getCreatedAt().format(FORMATTER) : null
        );
    }

    public static NotificationResponse from(ProjectNotification notification) {
        return new NotificationResponse(
                notification.getId(),
                notification.getType().name(),
                notification.getReadAt() == null ? "PENDING" : "READ",
                notification.getActor().getNickname(),
                notification.getActor().getProfileImage(),
                notification.getProject().getRoom().getId(),
                switch (notification.getType()) {
                    case PROJECT_REQUESTED -> "새로운 프로젝트 요청이 있습니다.";
                    case PROJECT_UPDATED -> "프로젝트 조건이 수정되었습니다.";
                    case PROJECT_ACCEPTED -> "프로젝트가 수락되었습니다.";
                    case PROJECT_REJECTED -> "프로젝트가 거절되었습니다.";
                    case PROJECT_COMPLETION_REQUESTED -> "프로젝트 완료 요청이 있습니다.";
                    case PROJECT_COMPLETED -> "프로젝트가 완료되었습니다.";
                    case PROJECT_CANCELLATION_REQUESTED -> "프로젝트 취소 요청이 있습니다.";
                    case PROJECT_CANCELED -> "프로젝트가 취소되었습니다.";
                    case PROJECT_DISPUTE_REJECTED -> "AI 분쟁 조정이 거절되었습니다.";
                },
                notification.getCreatedAt() != null ? notification.getCreatedAt().format(FORMATTER) : null
        );
    }

    /** 에디터가 수락/거절했을 때 크리에이터(requester)에게 보내는 알림 */
    public static NotificationResponse fromForRequester(MatchRequest request, String chatRoomId) {
        String type = request.getStatus() == MatchRequestStatus.ACCEPTED
                ? "MATCHING_ACCEPTED"
                : "MATCHING_REJECTED";
        return new NotificationResponse(
                request.getId(),
                type,
                "PENDING",
                request.getEditor().getNickname(),
                request.getEditor().getProfileImage(),
                chatRoomId,
                null,
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
