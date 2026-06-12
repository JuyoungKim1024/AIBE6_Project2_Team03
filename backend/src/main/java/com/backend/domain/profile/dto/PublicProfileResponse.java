package com.backend.domain.profile.dto;

import java.util.List;

public record PublicProfileResponse(
        String id,
        String nickname,
        String profileImage,
        String role,
        List<String> fieldTags,
        List<String> toolTags,
        int battlePower,
        List<PortfolioResponse> portfolios,
        List<ReviewResponse> reviews,
        List<RecentDealResponse> recentDeals,
        boolean publicPostsVisible,
        boolean publicLikedPostsVisible,
        List<PublicProfilePostResponse> posts,
        List<PublicProfilePostResponse> likedPosts
) {
}
