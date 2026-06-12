package com.backend.domain.post.dto;

import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.PostTag;

import java.time.LocalDateTime;
import java.util.List;

public record CommunityPostResponse(
        String id,
        AuthorResponse author,
        String title,
        CommunityPost.Category category,
        List<String> tags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        LocalDateTime createdAt
) {
    public static CommunityPostResponse from(CommunityPost post) {
        return new CommunityPostResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getCategory(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.GENERAL)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getThumbnailUrl(),
                post.getViewCount(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getCreatedAt()
        );
    }
}
