package com.backend.domain.mypage.dto;

public record PublicContentVisibilityRequest(
        Boolean publicPostsVisible,
        Boolean publicJobPostsVisible,
        Boolean publicCommunityPostsVisible,
        Boolean publicLikedPostsVisible
) {
}
