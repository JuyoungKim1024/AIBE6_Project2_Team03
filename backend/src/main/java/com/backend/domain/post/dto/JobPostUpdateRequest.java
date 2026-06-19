package com.backend.domain.post.dto;

import java.util.List;

public record JobPostUpdateRequest(
        String title,
        String content,
        String thumbnailUrl,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        Integer revisionCount,
        List<String> fieldTags,
        List<String> toolTags,
        List<String> portfolioIds
) {}
