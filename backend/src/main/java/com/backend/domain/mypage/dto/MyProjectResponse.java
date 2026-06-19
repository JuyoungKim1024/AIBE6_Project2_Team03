package com.backend.domain.mypage.dto;

public record MyProjectResponse(
        String id,
        String roomId,
        String requesterId,
        String partnerName,
        String field,
        String status,
        String date
) {
}
