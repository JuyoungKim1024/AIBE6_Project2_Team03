package com.backend.domain.post.dto;

import com.backend.domain.user.entity.User;

public record AuthorResponse(
        String id,
        String nickname,
        String profileImage,
        boolean isDeleted
) {
    public static AuthorResponse from(User user) {
        if (user.isDeleted()) {
            return new AuthorResponse(user.getId(), "탈퇴한 사용자", null, true);
        }
        return new AuthorResponse(user.getId(), user.getNickname(), user.getProfileImage(), false);
    }
}
