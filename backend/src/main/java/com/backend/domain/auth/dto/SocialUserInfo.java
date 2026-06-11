package com.backend.domain.auth.dto;

import com.backend.domain.user.entity.SocialProvider;

public record SocialUserInfo(
        SocialProvider provider,
        String socialId,
        String email,
        String nickname,
        String profileImage
) {
}
