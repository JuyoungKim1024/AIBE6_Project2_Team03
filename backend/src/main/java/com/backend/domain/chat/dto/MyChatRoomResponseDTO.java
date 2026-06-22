package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.user.entity.UserRole;

public record MyChatRoomResponseDTO(
        String id,
        String partnerId,
        String partnerName,
        UserRole partnerRole,
        String lastMessage,
        String time,
        ChatRoomType type,
        int unreadCount,
        ChatPostSummaryDTO post,
        boolean partnerDeleted
) {
}
