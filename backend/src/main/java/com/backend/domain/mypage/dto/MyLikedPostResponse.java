package com.backend.domain.mypage.dto;

public record MyLikedPostResponse(
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
