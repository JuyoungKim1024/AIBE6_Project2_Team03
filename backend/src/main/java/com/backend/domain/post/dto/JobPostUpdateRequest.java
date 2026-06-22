package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;
import java.util.List;

public record JobPostUpdateRequest(
        String title,
        String content,
        String thumbnailUrl,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        JobPost.PriceUnit priceUnit,
        Integer revisionCount,
        List<String> fieldTags,
        List<String> toolTags,
        List<String> portfolioGroupIds
) {}
