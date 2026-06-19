package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.ChatRoomType;

public record ChatRequestCreateRequestDTO (
        ChatRoomType roomType,
        String receiverId,
        String postId,
        String message
){
}
