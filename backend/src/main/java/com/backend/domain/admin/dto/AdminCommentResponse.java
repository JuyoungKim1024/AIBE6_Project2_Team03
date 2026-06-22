package com.backend.domain.admin.dto;

import com.backend.domain.post.entity.Comment;
import java.time.LocalDateTime;

public record AdminCommentResponse(
        String id,
        String postId,
        String postTitle,
        String writerId,
        String writerNickname,
        boolean writerDeleted,
        String content,
        LocalDateTime createdAt
) {
    public static AdminCommentResponse from(Comment comment) {
        return new AdminCommentResponse(
                comment.getId(),
                comment.getPost().getId(),
                comment.getPost().getTitle(),
                comment.getWriter().getId(),
                comment.getWriter().getNickname(),
                comment.getWriter().isDeleted(),
                comment.getContent(),
                comment.getCreatedAt()
        );
    }
}
