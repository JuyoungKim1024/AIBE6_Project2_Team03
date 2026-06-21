package com.backend.domain.point.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.point.dto.PointBalanceResponse;
import com.backend.domain.point.dto.PointChargeRequest;
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

    // POST /api/point/release/{matchRequestId} — 작업 완료 확인 (안전결제 → 에디터 정산)
    @PostMapping("/release/{matchRequestId}")
    public ResponseEntity<Void> releaseSafePayment(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String matchRequestId
    ) {
        pointService.releaseSafePayment(matchRequestId, authService.resolveUserId(authorizationHeader));
        return ResponseEntity.ok().build();
    }

    // POST /api/point/refund/{matchRequestId} — 매칭 취소 시 안전결제 환불
    @PostMapping("/refund/{matchRequestId}")
    public ResponseEntity<Void> refundSafePayment(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String matchRequestId
    ) {
        pointService.refundSafePayment(matchRequestId, authService.resolveUserId(authorizationHeader));
        return ResponseEntity.ok().build();
    }
}
