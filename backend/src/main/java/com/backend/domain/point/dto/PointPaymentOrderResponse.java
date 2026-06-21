package com.backend.domain.point.dto;

public record PointPaymentOrderResponse(
        String orderId,
        String orderName,
        int amount,
        int points
) {
}
