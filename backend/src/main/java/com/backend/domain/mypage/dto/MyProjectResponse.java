package com.backend.domain.mypage.dto;

public record MyProjectResponse(
        String id,
        String roomId,
        String requesterId,
        String proposedById,
        String partnerName,
        String field,
        String status,
        String completionRequestedBy,
        String cancellationRequestedBy,
        boolean reviewSubmitted,
        String date
) {
}
