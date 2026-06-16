package com.backend.domain.post.dto;

public record CommentCreateRequest(String content, String parentId) {}
