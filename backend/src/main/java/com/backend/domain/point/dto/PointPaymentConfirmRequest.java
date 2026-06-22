package com.backend.domain.point.dto;

public record PointPaymentConfirmRequest(
        String paymentKey,
        String orderId,
        int amount
) {
}
