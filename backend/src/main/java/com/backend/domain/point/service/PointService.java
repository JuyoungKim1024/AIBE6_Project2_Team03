package com.backend.domain.point.service;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.point.dto.PointBalanceResponse;
import com.backend.domain.point.dto.PointPaymentConfirmRequest;
import com.backend.domain.point.dto.PointPaymentOrderResponse;
import com.backend.domain.point.dto.PointTransactionResponse;
import com.backend.domain.point.entity.PointPaymentOrder;
import com.backend.domain.point.entity.PointPaymentStatus;
import com.backend.domain.point.entity.PointTransaction;
import com.backend.domain.point.entity.PointTransactionType;
import com.backend.domain.point.repository.PointPaymentOrderRepository;
import com.backend.domain.point.repository.PointTransactionRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PointService {

    private final UserRepository userRepository;
    private final MyPageMatchRequestRepository matchRequestRepository;
    private final PointTransactionRepository transactionRepository;
    private final PointPaymentOrderRepository paymentOrderRepository;
    private final TossPaymentsClient tossPaymentsClient;

    @Transactional
    public PointPaymentOrderResponse createPaymentOrder(String userId, int amount) {
        if (amount < 100 || amount > 1_000_000) {
            throw new IllegalArgumentException("충전 금액은 100원 이상 1,000,000원 이하로 입력해주세요.");
        }

        User user = getUser(userId);
        String orderId = "point_" + UUID.randomUUID().toString().replace("-", "");
        PointPaymentOrder order = paymentOrderRepository.save(
                new PointPaymentOrder(orderId, user, amount, amount)
        );

        return new PointPaymentOrderResponse(
                order.getOrderId(),
                amount + " 포인트 충전",
                order.getAmount(),
                order.getPoints()
        );
    }

    @Transactional
    public PointBalanceResponse confirmPayment(String userId, PointPaymentConfirmRequest request) {
        if (request.paymentKey() == null || request.paymentKey().isBlank()
                || request.orderId() == null || request.orderId().isBlank()) {
            throw new IllegalArgumentException("결제 승인 정보가 올바르지 않습니다.");
        }

        PointPaymentOrder order = paymentOrderRepository
                .findByOrderIdAndUser_Id(request.orderId(), userId)
                .orElseThrow(() -> new IllegalArgumentException("결제 주문을 찾을 수 없습니다."));

        if (order.getStatus() == PointPaymentStatus.DONE) {
            return getBalance(userId);
        }
        if (order.getAmount() != request.amount()) {
            throw new IllegalArgumentException("결제 금액이 주문 금액과 일치하지 않습니다.");
        }
        if (paymentOrderRepository.existsByPaymentKey(request.paymentKey())) {
            throw new IllegalStateException("이미 처리된 결제입니다.");
        }

        TossPaymentsClient.TossPayment payment = tossPaymentsClient.confirm(
                request.paymentKey(),
                order.getOrderId(),
                order.getAmount()
        );
        if (!"DONE".equals(payment.status())
                || !order.getOrderId().equals(payment.orderId())
                || order.getAmount() != payment.totalAmount()
                || !request.paymentKey().equals(payment.paymentKey())) {
            throw new IllegalStateException("결제 승인 정보가 주문과 일치하지 않습니다.");
        }

        User user = order.getUser();
        user.chargePoint(order.getPoints());
        transactionRepository.save(new PointTransaction(
                user,
                order.getPoints(),
                PointTransactionType.CHARGE,
                order.getPoints() + "P 토스페이먼츠 충전",
                null
        ));
        order.complete(payment.paymentKey());

        return new PointBalanceResponse(user.getPoint(), user.getEscrowPoint());
    }

    public PointBalanceResponse getBalance(String userId) {
        User user = getUser(userId);
        return new PointBalanceResponse(user.getPoint(), user.getEscrowPoint());
    }

    public List<PointTransactionResponse> getTransactions(String userId) {
        return transactionRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PointTransactionResponse::from)
                .toList();
    }

    @Transactional
    public void holdEscrow(String matchRequestId) {
        MatchRequest request = getMatchRequest(matchRequestId);
        if (request.getAgreedAmount() == null) return;

        User requester = request.getRequester();
        int amount = request.getAgreedAmount();

        requester.holdEscrow(amount);
        transactionRepository.save(new PointTransaction(
                requester,
                amount,
                PointTransactionType.ESCROW_HOLD,
                request.getEditor().getNickname() + "님과의 매칭 거래 보증금 차감",
                matchRequestId
        ));
    }

    @Transactional
    public void releaseEscrow(String matchRequestId, String requesterId) {
        MatchRequest request = getMatchRequest(matchRequestId);
        if (!request.getRequester().getId().equals(requesterId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        if (request.getAgreedAmount() == null) {
            throw new IllegalStateException("합의 금액이 설정되지 않은 매칭입니다.");
        }

        User requester = request.getRequester();
        User editor = request.getEditor();
        int amount = request.getAgreedAmount();

        requester.releaseEscrow(amount, editor);
        transactionRepository.save(new PointTransaction(
                requester,
                amount,
                PointTransactionType.ESCROW_RELEASE,
                editor.getNickname() + "님과 작업 완료 정산",
                matchRequestId
        ));
        transactionRepository.save(new PointTransaction(
                editor,
                amount,
                PointTransactionType.ESCROW_RELEASE,
                requester.getNickname() + "님의 작업 완료 수령",
                matchRequestId
        ));
    }

    @Transactional
    public void refundEscrow(String matchRequestId, String userId) {
        MatchRequest request = getMatchRequest(matchRequestId);
        boolean isRequester = request.getRequester().getId().equals(userId);
        boolean isEditor = request.getEditor().getId().equals(userId);
        if (!isRequester && !isEditor) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        if (request.getAgreedAmount() == null) return;

        User requester = request.getRequester();
        int amount = request.getAgreedAmount();

        requester.refundEscrow(amount);
        transactionRepository.save(new PointTransaction(
                requester,
                amount,
                PointTransactionType.ESCROW_REFUND,
                request.getEditor().getNickname() + "님과의 매칭 취소 환불",
                matchRequestId
        ));
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private MatchRequest getMatchRequest(String matchRequestId) {
        return matchRequestRepository.findById(matchRequestId)
                .orElseThrow(() -> new IllegalArgumentException("매칭 요청을 찾을 수 없습니다."));
    }
}
