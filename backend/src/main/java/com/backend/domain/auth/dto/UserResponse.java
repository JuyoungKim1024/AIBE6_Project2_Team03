package com.backend.domain.auth.dto;

import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;

public record UserResponse(
        String id,
        SocialProvider provider,
        String email,
        String nickname,
        String profileImage,
        String name,
        String phone,
        UserRole role,
        boolean onboardingRequired,
        boolean termsAgreed,
        boolean admin
) {
    public static UserResponse from(User user) {
        return from(user, null, null);
    }

    public static UserResponse from(User user, String name, String phone) {
        return new UserResponse(
                user.getId(),
                user.getProvider(),
                user.getProviderEmail(),
                user.getNickname(),
                user.getProfileImage(),
                name,
                phone,
                user.getRole(),
                !user.isAdmin() && (user.getRole() == null || name == null || name.isBlank() || phone == null || phone.isBlank()),
                user.hasAgreedToTerms(),
                user.isAdmin()
        );
    }
}
