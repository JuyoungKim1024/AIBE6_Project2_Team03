package com.backend.domain.chat.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.dto.ChatRequestCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRequestResponseDTO;
import com.backend.domain.chat.service.ChatRequestService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/chat/requests")
public class ChatRequestController {

    private final ChatRequestService chatRequestService;
    private final AuthService authService;

    @PostMapping
    public ChatRequestResponseDTO createRequest(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ChatRequestCreateRequestDTO request
            ) {

        String requesterId = authService.resolveUserId(authorizationHeader);

        return chatRequestService.createRequest(requesterId, request);
    }

    @GetMapping("/received")
    public List<ChatRequestResponseDTO> getReceivedRequests(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        String receiverId = authService.resolveUserId(authorizationHeader);
        return chatRequestService.getReceivedRequests(receiverId);

    }

    @PatchMapping("/{requestId}/accept")
    public ChatRequestResponseDTO acceptRequest(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String requestId
    ) {
        String receiverId = authService.resolveUserId(authorizationHeader);
        return chatRequestService.acceptRequest(requestId, receiverId);
    }

    @PatchMapping("/{requestId}/reject")
    public ChatRequestResponseDTO rejectRequest(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String requestId
    ) {
        String receiverId = authService.resolveUserId(authorizationHeader);
        return chatRequestService.rejectRequest(requestId, receiverId);
    }

}
