package com.backend.domain.profile.dto;

public record ReviewResponse(
        String id,
        String author,
        double rating,
        String content,
        String date
) {
}
