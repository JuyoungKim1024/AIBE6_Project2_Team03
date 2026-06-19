package com.backend.domain.mypage.dto;

import com.backend.domain.profile.entity.PortfolioGroup;

public record PortfolioGroupResponse(
        String id,
        String name,
        int displayOrder,
        boolean representative
) {
    public static PortfolioGroupResponse from(PortfolioGroup group) {
        return new PortfolioGroupResponse(
                group.getId(),
                group.getName(),
                group.getDisplayOrder(),
                group.isRepresentative()
        );
    }
}
