package com.backend.domain.mypage.dto;

public record MyChatRoomResponse(
        String id,
        String partnerName,
        String lastMessage,
        String time,
        int unreadCount
) {
}
