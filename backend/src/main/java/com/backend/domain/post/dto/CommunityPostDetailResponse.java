package com.backend.domain.post.dto;

import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.PostTag;

import java.time.LocalDateTime;
import java.util.List;

public record CommunityPostDetailResponse(
        String id,
        AuthorResponse author,
        String title,
        String content,
        CommunityPost.Category category,
        List<String> tags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        int commentCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static CommunityPostDetailResponse from(CommunityPost post) {
        return new CommunityPostDetailResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getContent(),
                post.getCategory(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.GENERAL)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getThumbnailUrl(),
                post.getViewCount(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getCommentCount(),
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
