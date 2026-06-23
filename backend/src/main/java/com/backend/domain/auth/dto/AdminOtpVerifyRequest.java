package com.backend.domain.auth.dto;

public record AdminOtpVerifyRequest(
        String email,
        String code
) {
}
