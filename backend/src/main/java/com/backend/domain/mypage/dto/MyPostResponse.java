package com.backend.domain.mypage.dto;

public record MyPostResponse(
        String id,
        String boardType,
        String postType,
        String title,
        String date,
        int views,
        int comments,
        int likes,
        boolean publicVisible
) {
}
