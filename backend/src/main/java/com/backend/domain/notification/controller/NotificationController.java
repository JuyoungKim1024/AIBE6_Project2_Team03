package com.backend.domain.notification.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.notification.dto.NotificationResponse;
import com.backend.domain.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final AuthService authService;
    private final NotificationService notificationService;

    // GET /api/notifications
    @GetMapping
    public List<NotificationResponse> getNotifications(
            @RequestHeader("Authorization") String authorizationHeader) {
        String userId = authService.resolveUserId(authorizationHeader);
        return notificationService.getNotifications(userId);
    }

    // PATCH /api/notifications/{id}/accept
    @PatchMapping("/{id}/accept")
    public NotificationResponse accept(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorizationHeader) {
        String userId = authService.resolveUserId(authorizationHeader);
        return notificationService.accept(id, userId);
    }

    // PATCH /api/notifications/{id}/reject
    @PatchMapping("/{id}/reject")
    public NotificationResponse reject(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorizationHeader) {
        String userId = authService.resolveUserId(authorizationHeader);
        return notificationService.reject(id, userId);
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markAsRead(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorizationHeader) {
        return notificationService.markAsRead(id, authService.resolveUserId(authorizationHeader));
    }
}
