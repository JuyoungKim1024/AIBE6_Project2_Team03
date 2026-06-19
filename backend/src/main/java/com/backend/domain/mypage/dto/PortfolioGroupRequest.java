package com.backend.domain.mypage.dto;

public record PortfolioGroupRequest(
        String id,
        String name,
        int displayOrder,
        boolean representative
) {
}
