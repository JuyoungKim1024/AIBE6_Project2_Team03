package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;

import java.util.List;

public record JobPostCreateRequest(
        String title,
        String content,
        JobPost.PostType postType,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        List<String> fieldTags,
        List<String> toolTags
) {}
