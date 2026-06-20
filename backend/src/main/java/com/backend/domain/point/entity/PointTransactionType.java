package com.backend.domain.point.entity;

public enum PointTransactionType {
    CHARGE,             // 포인트 충전
    ESCROW_HOLD,        // 매칭 수락 시 에스크로 보관
    ESCROW_RELEASE,     // 작업 완료 시 에디터에게 지급
    ESCROW_REFUND,      // 취소 시 크리에이터에게 환불
    DISPUTE_SETTLEMENT  // AI 분쟁 조정 정산
}
