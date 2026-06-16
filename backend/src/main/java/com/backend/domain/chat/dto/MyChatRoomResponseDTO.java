package com.backend.domain.chat.dto;

public record MyChatRoomResponseDTO(
        String id,
        String partnerName,
        String lastMessage,
        String time,
        int unreadCount
) {
}
