package com.backend.domain.chat.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/chat")
@RequiredArgsConstructor
public class ChatController {

    private final AuthService authService;
    private final ChatService chatService;

    // GET /api/chat/unread-count
    @GetMapping("/unread-count")
    public Map<String, Integer> getUnreadCount(
            @RequestHeader("Authorization") String authorizationHeader) {
        String userId = authService.resolveUserId(authorizationHeader);
        return Map.of("count", chatService.getUnreadCount(userId));
    }
}
