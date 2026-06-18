package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;

import java.util.List;

public record JobPostCreateRequest(
        String title,
        String content,
        String thumbnailUrl,
        JobPost.PostType postType,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        Integer revisionCount,
        List<String> fieldTags,
        List<String> toolTags,
        List<String> portfolioIds
) {}
