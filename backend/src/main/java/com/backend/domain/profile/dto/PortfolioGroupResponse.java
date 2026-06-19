package com.backend.domain.profile.dto;

public record PortfolioGroupResponse(
        String id,
        String name,
        int order,
        boolean representative
) {
}
