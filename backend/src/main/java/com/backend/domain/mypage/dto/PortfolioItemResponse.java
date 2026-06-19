package com.backend.domain.mypage.dto;

import com.backend.domain.profile.entity.Portfolio;

public record PortfolioItemResponse(
        String id,
        String title,
        String url,
        String type,
        boolean representative,
        int displayOrder,
        String groupId
) {
    public static PortfolioItemResponse from(Portfolio portfolio) {
        String url = portfolio.getThumbnailUrl() != null ? portfolio.getThumbnailUrl() : portfolio.getImageUrl();
        String type = portfolio.getImageUrl() != null && portfolio.getThumbnailUrl() == null ? "image" : "video";
        return new PortfolioItemResponse(
                portfolio.getId(),
                portfolio.getTitle(),
                url,
                type,
                portfolio.isRepresentative(),
                portfolio.getDisplayOrder(),
                portfolio.getGroup() == null ? null : portfolio.getGroup().getId()
        );
    }
}
