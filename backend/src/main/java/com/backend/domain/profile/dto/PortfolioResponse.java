package com.backend.domain.profile.dto;

public record PortfolioResponse(
        String id,
        String title,
        String thumbnailUrl,
        int order
) {
}
