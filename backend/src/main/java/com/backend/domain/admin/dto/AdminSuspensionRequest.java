package com.backend.domain.admin.dto;

public record AdminSuspensionRequest(
        int duration,
        DurationUnit unit,
        String reason
) {
    public enum DurationUnit {
        HOURS,
        DAYS
    }
}
