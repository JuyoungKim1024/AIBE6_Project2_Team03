package com.backend.domain.auth.dto;

public record EmailVerificationCompleteResponse(
        String verificationToken
) {
}
