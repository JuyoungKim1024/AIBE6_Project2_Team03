package com.backend.domain.chat.dto;

public record ChatUnreadResponseDTO(
        String roomId,
        int roomUnreadCount,
        int totalUnreadCount
) {
}
