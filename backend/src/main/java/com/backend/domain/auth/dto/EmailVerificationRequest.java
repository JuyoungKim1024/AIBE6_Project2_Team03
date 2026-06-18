package com.backend.domain.auth.dto;

public record EmailVerificationRequest(
        String email,
        String code
) {
}
