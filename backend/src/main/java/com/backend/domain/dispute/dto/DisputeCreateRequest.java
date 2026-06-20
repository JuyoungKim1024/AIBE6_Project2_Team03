package com.backend.domain.dispute.dto;

import com.backend.domain.dispute.entity.DisputeType;

public record DisputeCreateRequest(
        String projectId,
        DisputeType type,
        String description
) {}
