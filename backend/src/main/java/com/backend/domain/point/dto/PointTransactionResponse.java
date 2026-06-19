package com.backend.domain.point.dto;

import com.backend.domain.point.entity.PointTransaction;
import java.time.format.DateTimeFormatter;

public record PointTransactionResponse(
        String id,
        int amount,
        String type,
        String description,
        String matchRequestId,
        String createdAt
) {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd HH:mm");

    public static PointTransactionResponse from(PointTransaction tx) {
        return new PointTransactionResponse(
                tx.getId(),
                tx.getAmount(),
                tx.getType().name(),
                tx.getDescription(),
                tx.getMatchRequestId(),
                tx.getCreatedAt() == null ? "" : tx.getCreatedAt().format(FORMATTER)
        );
    }
}
