package com.backend.domain.post.dto;

import com.backend.domain.post.entity.CommunityPost;

import java.util.List;

public record CommunityPostCreateRequest(
        String title,
        String content,
        String thumbnailUrl,
        CommunityPost.Category category,
        List<String> tags
) {}
