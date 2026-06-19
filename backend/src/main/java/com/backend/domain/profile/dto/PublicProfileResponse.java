package com.backend.domain.profile.dto;

import com.backend.domain.mypage.dto.MyPostResponse;
import java.util.List;

public record PublicProfileResponse(
        String id,
        String nickname,
        String profileImage,
        String role,
        List<String> fieldTags,
        List<String> toolTags,
        int battlePower,
        long completedProjectCount,
        long reviewCount,
        List<PortfolioGroupResponse> portfolioGroups,
        List<PortfolioResponse> portfolios,
        List<ReviewResponse> reviews,
        List<RecentDealResponse> recentDeals,
        boolean publicPostsVisible,
        boolean publicJobPostsVisible,
        boolean publicCommunityPostsVisible,
        List<MyPostResponse> posts,
        boolean publicLikedPostsVisible,
        List<MyPostResponse> likedPosts
) {
}
