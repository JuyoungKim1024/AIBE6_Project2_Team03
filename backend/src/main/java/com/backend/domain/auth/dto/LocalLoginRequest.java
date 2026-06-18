package com.backend.domain.auth.dto;

public record LocalLoginRequest(
        String email,
        String password
) {
}
