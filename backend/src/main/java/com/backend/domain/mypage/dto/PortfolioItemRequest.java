package com.backend.domain.mypage.dto;

public record PortfolioItemRequest(
        String title,
        String url,
        String type,
        boolean representative,
        int displayOrder,
        String groupId
) {
}
