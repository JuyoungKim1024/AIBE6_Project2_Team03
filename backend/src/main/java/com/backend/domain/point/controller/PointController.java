package com.backend.domain.point.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.point.dto.PointBalanceResponse;
import com.backend.domain.point.dto.PointChargeRequest;
import com.backend.domain.point.dto.PointTransactionResponse;
import com.backend.domain.point.service.PointService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
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

    // POST /api/point/charge — 포인트 충전
    @PostMapping("/charge")
    public PointBalanceResponse charge(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody PointChargeRequest request
    ) {
        return pointService.charge(authService.resolveUserId(authorizationHeader), request.amount());
    }

    // GET /api/point — 내 포인트 잔액 조회
    @GetMapping
    public PointBalanceResponse getBalance(@RequestHeader("Authorization") String authorizationHeader) {
        return pointService.getBalance(authService.resolveUserId(authorizationHeader));
    }

    // GET /api/point/transactions — 포인트 사용 내역
    @GetMapping("/transactions")
    public List<PointTransactionResponse> getTransactions(@RequestHeader("Authorization") String authorizationHeader) {
        return pointService.getTransactions(authService.resolveUserId(authorizationHeader));
    }
}
