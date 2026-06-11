package com.backend.domain.auth.dto;

import com.backend.domain.user.entity.UserRole;

public record RoleUpdateRequest(UserRole role) {
}
