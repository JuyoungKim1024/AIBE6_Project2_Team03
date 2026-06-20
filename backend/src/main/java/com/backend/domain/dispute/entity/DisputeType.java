package com.backend.domain.dispute.entity;

public enum DisputeType {
    QUALITY,    // 품질 불만
    DEADLINE,   // 납기 위반
    SCOPE,      // 범위 초과 요청
    MISSING,    // 잠수/연락 두절
    COPYRIGHT   // 저작권 침해
}
