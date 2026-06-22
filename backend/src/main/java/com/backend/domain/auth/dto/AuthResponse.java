package com.backend.domain.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.backend.domain.user.entity.User;

public record AuthResponse(
        String accessToken,
        @JsonIgnore
        String refreshToken,
        boolean onboardingRequired,
        UserResponse user
) {
    public static AuthResponse of(String accessToken, String refreshToken, User user, boolean onboardingRequired) {
        return new AuthResponse(accessToken, refreshToken, onboardingRequired, UserResponse.from(user));
    }
}
