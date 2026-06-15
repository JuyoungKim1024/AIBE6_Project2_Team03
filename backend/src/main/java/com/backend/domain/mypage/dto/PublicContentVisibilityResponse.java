package com.backend.domain.mypage.dto;

public record PublicContentVisibilityResponse(
        boolean publicPostsVisible,
        boolean publicLikedPostsVisible
) {
}
