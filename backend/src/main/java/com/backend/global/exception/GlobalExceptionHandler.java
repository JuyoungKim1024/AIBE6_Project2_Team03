package com.backend.global.exception;

import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(SuspendedAccountException.class)
    public ResponseEntity<Map<String, Object>> handleSuspendedAccount(
            SuspendedAccountException exception
    ) {
        return ResponseEntity.status(HttpStatus.LOCKED).body(Map.of(
                "code", "ACCOUNT_SUSPENDED",
                "message", exception.getMessage(),
                "reason", exception.getReason(),
                "suspendedUntil", exception.getSuspendedUntil(),
                "remainingMinutes", exception.getRemainingMinutes()
        ));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(IllegalArgumentException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> handleIllegalStateException(IllegalStateException exception) {
        return ResponseEntity.badRequest().body(Map.of("message", exception.getMessage()));
    }
}
