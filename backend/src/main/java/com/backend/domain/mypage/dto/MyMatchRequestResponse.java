package com.backend.domain.mypage.dto;

public record MyMatchRequestResponse(
        String id,
        String requesterName,
        String status,
        String date
) {
}
