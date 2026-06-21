package com.backend.domain.point.service;

import com.backend.domain.project.entity.Project;
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
        return new PointBalanceResponse(user.getPoint(), user.getSafePaymentPoint());
    }

    public PointBalanceResponse getBalance(String userId) {
        User user = getUser(userId);
        return new PointBalanceResponse(user.getPoint(), user.getSafePaymentPoint());
    }

    public List<PointTransactionResponse> getTransactions(String userId) {
        return transactionRepository.findByUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(PointTransactionResponse::from)
                .toList();
    }

    // 프로젝트 카드 수락(계약 확정) 시 크리에이터 포인트 → 안전결제 보관
    @Transactional
    public void holdSafePaymentForProject(Project project) {
        if (project.getPrice() == null || project.getPrice() <= 0) return;
        User requester = project.getRequester();
        int amount = project.getPrice();
        requester.holdSafePayment(amount);
        transactionRepository.save(new PointTransaction(
                requester, -amount, PointTransactionType.SAFE_PAYMENT_HOLD,
                project.getEditor().getNickname() + "님 프로젝트 안전결제 보관",
                null
        ));
    }

    // 프로젝트 완료 시 안전결제 → 에디터
    @Transactional
    public void releaseSafePaymentForProject(Project project) {
        if (project.getPrice() == null || project.getPrice() <= 0) return;
        User requester = project.getRequester();
        User editor = project.getEditor();
        int amount = project.getPrice();
        requester.releaseSafePayment(amount, editor);
        transactionRepository.save(new PointTransaction(
                editor, amount, PointTransactionType.SAFE_PAYMENT_RELEASE,
                requester.getNickname() + "님 프로젝트 완료 수령",
                null
        ));
        transactionRepository.save(new PointTransaction(
                requester, -amount, PointTransactionType.SAFE_PAYMENT_RELEASE,
                editor.getNickname() + "님께 프로젝트 완료 정산",
                null
        ));
    }

    // 프로젝트 취소 시 안전결제 → 크리에이터 환불
    @Transactional
    public void refundSafePaymentForProject(Project project) {
        if (project.getPrice() == null || project.getPrice() <= 0) return;
        User requester = project.getRequester();
        int amount = project.getPrice();
        requester.refundSafePayment(amount);
        transactionRepository.save(new PointTransaction(
                requester, amount, PointTransactionType.SAFE_PAYMENT_REFUND,
                project.getEditor().getNickname() + "님과의 프로젝트 취소 환불",
                null
        ));
    }

    // AI 분쟁 조정 정산 - finalAmount를 에디터에게, 나머지는 크리에이터에게 환불
    @Transactional
    public void settleDispute(Project project, int finalAmount) {
        if (project.getPrice() == null || project.getPrice() <= 0) {
            throw new IllegalStateException("프로젝트 금액이 설정되지 않아 정산할 수 없습니다.");
        }
        int originalAmount = project.getPrice();
        if (finalAmount < 0 || finalAmount > originalAmount) {
            throw new IllegalArgumentException("조정 금액이 원래 금액 범위를 벗어납니다.");
        }
        int refundAmount = originalAmount - finalAmount;

        User requester = project.getRequester();
        User editor = project.getEditor();

        if (finalAmount > 0) {
            requester.releaseSafePayment(finalAmount, editor);
            transactionRepository.save(new PointTransaction(
                    editor, finalAmount, PointTransactionType.DISPUTE_SETTLEMENT,
                    "분쟁 조정 수령 (" + requester.getNickname() + "님)", null
            ));
            transactionRepository.save(new PointTransaction(
                    requester, -finalAmount, PointTransactionType.DISPUTE_SETTLEMENT,
                    "분쟁 조정 지급 (" + editor.getNickname() + "님)", null
            ));
        }
        if (refundAmount > 0) {
            requester.refundSafePayment(refundAmount);
            transactionRepository.save(new PointTransaction(
                    requester, refundAmount, PointTransactionType.DISPUTE_SETTLEMENT,
                    "분쟁 조정 환불 (" + editor.getNickname() + "님)", null
            ));
        }
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
