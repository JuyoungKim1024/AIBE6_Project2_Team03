package com.backend.domain.post.dto;

import com.backend.domain.user.entity.User;

public record AuthorResponse(
        String id,
        String nickname,
        String profileImage
) {
    public static AuthorResponse from(User user) {
        return new AuthorResponse(
                user.getId(),
                user.getNickname(),
                user.getProfileImage()
        );
    }
}
