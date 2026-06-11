package com.backend.domain.auth.dto;

import com.backend.domain.user.entity.User;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        boolean onboardingRequired,
        UserResponse user
) {
    public static AuthResponse of(String accessToken, String refreshToken, User user) {
        return new AuthResponse(accessToken, refreshToken, user.getRole() == null, UserResponse.from(user));
    }
}
