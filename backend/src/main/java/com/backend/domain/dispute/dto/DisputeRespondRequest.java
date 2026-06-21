package com.backend.domain.dispute.dto;

import jakarta.validation.constraints.NotNull;

public record DisputeRespondRequest(@NotNull Boolean accepted) {}
