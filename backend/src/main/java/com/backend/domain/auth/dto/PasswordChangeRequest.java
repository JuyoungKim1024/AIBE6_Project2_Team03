package com.backend.domain.auth.dto;

public record PasswordChangeRequest(
        String currentPassword,
        String newPassword
) {
}
