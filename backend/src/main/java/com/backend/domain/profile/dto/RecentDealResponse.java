package com.backend.domain.profile.dto;

public record RecentDealResponse(
        String id,
        String title,
        String status,
        String date
) {
}
