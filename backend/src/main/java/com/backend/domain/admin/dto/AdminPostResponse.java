package com.backend.domain.admin.dto;

import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.Post;
import java.time.LocalDateTime;

public record AdminPostResponse(
        String id,
        String boardType,
        String title,
        String authorId,
        String authorNickname,
        boolean authorDeleted,
        int commentCount,
        LocalDateTime createdAt
) {
    public static AdminPostResponse from(Post post) {
        String boardType = post instanceof JobPost
                ? "JOB"
                : post instanceof CommunityPost ? "COMMUNITY" : "UNKNOWN";
        return new AdminPostResponse(
                post.getId(),
                boardType,
                post.getTitle(),
                post.getAuthor().getId(),
                post.getAuthor().getNickname(),
                post.getAuthor().isDeleted(),
                post.getCommentCount(),
                post.getCreatedAt()
        );
    }
}
