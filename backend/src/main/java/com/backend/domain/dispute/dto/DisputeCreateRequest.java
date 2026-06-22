package com.backend.domain.dispute.dto;

import com.backend.domain.dispute.entity.DisputeType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DisputeCreateRequest(
        @NotBlank String projectId,
        @NotNull DisputeType type,
        @NotBlank String description
) {}
