package com.backend.global.exception;

import java.time.Duration;
import java.time.LocalDateTime;

public class SuspendedAccountException extends RuntimeException {

    private final String reason;
    private final LocalDateTime suspendedUntil;
    private final long remainingMinutes;

    public SuspendedAccountException(String reason, LocalDateTime suspendedUntil) {
        super("임시 제한 계정입니다.");
        this.reason = reason == null || reason.isBlank() ? "운영 정책 위반" : reason;
        this.suspendedUntil = suspendedUntil;
        this.remainingMinutes = Math.max(
                1,
                Duration.between(LocalDateTime.now(), suspendedUntil).toMinutes()
        );
    }

    public String getReason() {
        return reason;
    }

    public LocalDateTime getSuspendedUntil() {
        return suspendedUntil;
    }

    public long getRemainingMinutes() {
        return remainingMinutes;
    }
}
