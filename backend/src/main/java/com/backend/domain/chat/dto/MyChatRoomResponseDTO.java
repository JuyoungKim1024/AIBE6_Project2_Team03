package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.ChatRoomType;

public record MyChatRoomResponseDTO(
        String id,
        String partnerId,
        String partnerName,
        String lastMessage,
        String time,
        ChatRoomType type,
        int unreadCount,
        ChatPostSummaryDTO post,
        boolean partnerDeleted
) {
}
