package com.backend.domain.profile.dto;

public record PortfolioResponse(
        String id,
        String title,
        String thumbnailUrl,
        String type,
        int order,
        String groupId,
        String groupName,
        boolean representativeGroup
) {
}
