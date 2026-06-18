package com.backend.domain.point.service;

import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.point.dto.PointBalanceResponse;
import com.backend.domain.point.dto.PointTransactionResponse;
import com.backend.domain.point.entity.PointTransaction;
import com.backend.domain.point.entity.PointTransactionType;
import com.backend.domain.point.repository.PointTransactionRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import java.util.List;
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

    @Transactional
    public PointBalanceResponse charge(String userId, int amount) {
        if (amount <= 0) throw new IllegalArgumentException("충전 금액은 0보다 커야 합니다.");
        User user = getUser(userId);
        user.chargePoint(amount);
        transactionRepository.save(new PointTransaction(
                user, amount, PointTransactionType.CHARGE,
                amount + "P 충전",
                null
        ));
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

    // 매칭 수락 시 크리에이터 포인트 → 에스크로
    @Transactional
    public void holdEscrow(String matchRequestId) {
        MatchRequest request = getMatchRequest(matchRequestId);
        if (request.getAgreedAmount() == null) return;

        User requester = request.getRequester();
        int amount = request.getAgreedAmount();

        requester.holdEscrow(amount);
        transactionRepository.save(new PointTransaction(
                requester, amount, PointTransactionType.ESCROW_HOLD,
                request.getEditor().getNickname() + "님과의 매칭 거래 보증금 차감",
                matchRequestId
        ));
    }

    // 작업 완료 확인 시 에스크로 → 에디터
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
                requester, amount, PointTransactionType.ESCROW_RELEASE,
                editor.getNickname() + "님께 작업 완료 정산",
                matchRequestId
        ));
        transactionRepository.save(new PointTransaction(
                editor, amount, PointTransactionType.ESCROW_RELEASE,
                requester.getNickname() + "님 작업 완료 수령",
                matchRequestId
        ));
    }

    // 취소 시 에스크로 → 크리에이터 환불
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
                requester, amount, PointTransactionType.ESCROW_REFUND,
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
