package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.PostTag;

import java.time.LocalDateTime;
import java.util.List;

public record JobPostResponse(
        String id,
        AuthorResponse author,
        String title,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        JobPost.PostType postType,
        List<String> fieldTags,
        List<String> toolTags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        int commentCount,
        LocalDateTime createdAt
) {
    public static JobPostResponse from(JobPost post) {
        return new JobPostResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getMinPrice(),
                post.getMaxPrice(),
                post.isPriceVisible(),
                post.getPostType(),
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
                post.getCommentCount(),
                post.getCreatedAt()
        );
    }
}
