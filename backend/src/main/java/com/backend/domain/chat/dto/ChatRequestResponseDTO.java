package com.backend.domain.chat.dto;

import com.backend.domain.chat.entity.ChatRequest;
import com.backend.domain.chat.type.ChatRequestStatus;

public record ChatRequestResponseDTO (
        String id,
        ChatRequestStatus status,
        String chatRoomId,
        String senderName,
        String postTitle,
        String message
) {

    public static ChatRequestResponseDTO from(ChatRequest request) {
        return new ChatRequestResponseDTO(
                request.getId(),
                request.getStatus(),
                request.getChatRoom() == null ? null : request.getChatRoom().getId(),
                request.getRequester().getNickname(),
                request.getPost() == null ? null : request.getPost().getTitle(),
                request.getMessage()
        );
    }

}
