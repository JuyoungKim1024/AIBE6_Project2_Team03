package com.backend.domain.auth.dto;

public record AdminOtpChallengeResponse(
        boolean adminOtpRequired,
        int expiresInSeconds
) {
}
