package com.backend.domain.auth.dto;

public record ProfileUpdateRequest(
        String name,
        String phone,
        String nickname,
        String profileImage
) {
}
