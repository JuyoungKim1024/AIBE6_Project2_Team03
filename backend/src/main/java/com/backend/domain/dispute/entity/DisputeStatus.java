package com.backend.domain.dispute.entity;

public enum DisputeStatus {
    AI_PENDING,   // AI 판정 대기 중
    AI_JUDGED,    // AI 판정 완료, 양측 응답 대기
    AI_FAILED,    // AI 판정 실패 → 채팅에서 직접 협의
    ACCEPTED,     // 양측 수락 완료 → 정산 완료
    REJECTED      // 한쪽이 판정 거절 → 채팅에서 직접 재협의
}
