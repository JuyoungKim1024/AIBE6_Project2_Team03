package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.PostTag;

import java.time.LocalDateTime;
import java.util.List;

public record JobPostDetailResponse(
        String id,
        AuthorResponse author,
        String title,
        String content,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        JobPost.PostType postType,
        String portfolioId,
        List<String> fieldTags,
        List<String> toolTags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        Integer revisionCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static JobPostDetailResponse from(JobPost post) {
        return new JobPostDetailResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getContent(),
                post.getMinPrice(),
                post.getMaxPrice(),
                post.isPriceVisible(),
                post.getPostType(),
                post.getPortfolioId(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.FIELD)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.TOOL)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getThumbnailUrl(),
                post.getViewCount(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getRevisionCount(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
