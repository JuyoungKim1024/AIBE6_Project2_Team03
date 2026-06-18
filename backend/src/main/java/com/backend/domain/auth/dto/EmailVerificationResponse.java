package com.backend.domain.auth.dto;

public record EmailVerificationResponse(
        int expiresInSeconds
) {
}
