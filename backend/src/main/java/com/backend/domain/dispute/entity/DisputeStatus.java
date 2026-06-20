package com.backend.domain.dispute.entity;

public enum DisputeStatus {
    AI_PENDING,   // AI 판정 대기 중
    AI_JUDGED,    // AI 판정 완료, 양측 응답 대기
    ACCEPTED,     // 양측 수락 완료 → 정산 완료
    ESCALATED     // 불복 → 운영자 검토 이관
}
