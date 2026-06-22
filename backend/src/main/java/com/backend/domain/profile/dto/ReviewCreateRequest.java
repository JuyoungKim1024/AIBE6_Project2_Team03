package com.backend.domain.profile.dto;

public record ReviewCreateRequest(
        String projectId,
        double rating,
        String content
) {
}
