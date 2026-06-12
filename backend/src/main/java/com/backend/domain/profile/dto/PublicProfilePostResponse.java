package com.backend.domain.profile.dto;

public record PublicProfilePostResponse(
        String id,
        String boardType,
        String postType,
        String title,
        String authorName,
        int likes,
        int comments,
        int views,
        String date
) {
}
