package com.backend.domain.mypage.dto;

public record PublicContentVisibilityResponse(
        boolean publicPostsVisible,
        boolean publicJobPostsVisible,
        boolean publicCommunityPostsVisible,
        boolean publicLikedPostsVisible
) {
}
