package com.backend.domain.admin.dto;

import com.backend.domain.user.entity.User;
import java.time.Duration;
import java.time.LocalDateTime;

public record AdminUserResponse(
        String id,
        String email,
        String nickname,
        String provider,
        String role,
        boolean admin,
        boolean testAccount,
        boolean deleted,
        boolean suspended,
        LocalDateTime suspendedUntil,
        String suspensionReason,
        long remainingMinutes,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User user) {
        long remainingMinutes = user.isSuspended()
                ? Math.max(1, Duration.between(LocalDateTime.now(), user.getSuspendedUntil()).toMinutes())
                : 0;
        return new AdminUserResponse(
                user.getId(),
                user.getProviderEmail(),
                user.getNickname(),
                user.getProvider().name(),
                user.getRole() == null ? null : user.getRole().name(),
                user.isAdmin(),
                user.isTestAccount(),
                user.isDeleted(),
                user.isSuspended(),
                user.getSuspendedUntil(),
                user.getSuspensionReason(),
                remainingMinutes,
                user.getCreatedAt()
        );
    }
}
