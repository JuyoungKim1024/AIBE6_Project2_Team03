package com.backend.domain.post.dto;

import com.backend.domain.post.entity.Comment;

import java.time.LocalDateTime;
import java.util.List;

public record CommentResponse(
        String id,
        AuthorResponse author,
        String content,
        LocalDateTime createdAt,
        List<CommentResponse> replies
) {
    public static CommentResponse of(Comment comment, List<Comment> replies) {
        return new CommentResponse(
                comment.getId(),
                AuthorResponse.from(comment.getWriter()),
                comment.getContent(),
                comment.getCreatedAt(),
                replies.stream()
                        .map(r -> CommentResponse.of(r, List.of()))
                        .toList()
        );
    }
}
