package com.backend.domain.point.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.point.dto.PointBalanceResponse;
import com.backend.domain.point.dto.PointPaymentConfirmRequest;
import com.backend.domain.point.dto.PointPaymentOrderRequest;
import com.backend.domain.point.dto.PointPaymentOrderResponse;
import com.backend.domain.point.dto.PointTransactionResponse;
import com.backend.domain.point.service.PointService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/point")
@RequiredArgsConstructor
public class PointController {

    private final AuthService authService;
    private final PointService pointService;

    @PostMapping("/payments/orders")
    public PointPaymentOrderResponse createPaymentOrder(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody PointPaymentOrderRequest request
    ) {
        return pointService.createPaymentOrder(
                authService.resolveUserId(authorizationHeader),
                request.amount()
        );
    }

    @PostMapping("/payments/confirm")
    public PointBalanceResponse confirmPayment(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody PointPaymentConfirmRequest request
    ) {
        return pointService.confirmPayment(
                authService.resolveUserId(authorizationHeader),
                request
        );
    }

    @GetMapping
    public PointBalanceResponse getBalance(@RequestHeader("Authorization") String authorizationHeader) {
        return pointService.getBalance(authService.resolveUserId(authorizationHeader));
    }

    @GetMapping("/transactions")
    public List<PointTransactionResponse> getTransactions(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        return pointService.getTransactions(authService.resolveUserId(authorizationHeader));
    }

    @PostMapping("/release/{matchRequestId}")
    public ResponseEntity<Void> releaseEscrow(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String matchRequestId
    ) {
        pointService.releaseEscrow(matchRequestId, authService.resolveUserId(authorizationHeader));
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refund/{matchRequestId}")
    public ResponseEntity<Void> refundEscrow(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String matchRequestId
    ) {
        pointService.refundEscrow(matchRequestId, authService.resolveUserId(authorizationHeader));
        return ResponseEntity.ok().build();
    }
}
