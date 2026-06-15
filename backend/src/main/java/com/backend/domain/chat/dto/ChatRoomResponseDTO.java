package com.backend.domain.chat.dto;

import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.type.ChatRoomType;

import java.time.LocalDateTime;

public record ChatRoomResponseDTO (
        String roomId,
        ChatRoomType roomType,
        LocalDateTime createdAt
){
    public ChatRoomResponseDTO(ChatRoom chatRoom) {
        this (
                chatRoom.getId(),
                chatRoom.getChatRoomType(),
                chatRoom.getCreatedAt()
        );
    }
}
