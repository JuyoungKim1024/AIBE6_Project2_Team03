package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.chat.type.MessageType;

import java.time.LocalDateTime;
import java.util.List;

public record ChatMessageResponseDTO (
        String messageId,
        String roomId,
        String senderId,
        String content,
        MessageType messageType,
        LocalDateTime createAt
){

}
