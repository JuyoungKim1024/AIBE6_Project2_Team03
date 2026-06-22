package com.backend.domain.auth.dto;

public record PasswordResetCompleteRequest(
        String email,
        String password,
        String verificationToken
) {
}
