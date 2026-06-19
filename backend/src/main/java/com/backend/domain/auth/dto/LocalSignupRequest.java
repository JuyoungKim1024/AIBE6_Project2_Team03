package com.backend.domain.auth.dto;

public record LocalSignupRequest(
        String email,
        String password,
        String verificationToken
) {
}
