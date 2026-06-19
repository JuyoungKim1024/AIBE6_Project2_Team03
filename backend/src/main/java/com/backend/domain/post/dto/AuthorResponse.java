package com.backend.domain.post.dto;

import com.backend.domain.user.entity.User;

public record AuthorResponse(
        String id,
        String nickname,
        String profileImage,
        String rank
) {
    public static AuthorResponse from(User user) {
        if (user.isDeleted()) {
            return new AuthorResponse(user.getId(), "탈퇴한 사용자", null, "bronze");
        }
        return new AuthorResponse(user.getId(), user.getNickname(), user.getProfileImage(), toRank(user.getMannerScore()));
    }

    private static String toRank(int score) {
        if (score >= 90) return "diamond";
        if (score >= 70) return "platinum";
        if (score >= 50) return "gold";
        if (score > 30) return "silver";
        return "bronze";
    }
}
