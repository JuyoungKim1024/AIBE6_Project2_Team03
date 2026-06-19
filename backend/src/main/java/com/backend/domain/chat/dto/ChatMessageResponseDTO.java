package com.backend.domain.chat.dto;

import com.backend.domain.chat.entity.ChatMessage;
import com.backend.domain.chat.type.MessageType;

import java.time.LocalDateTime;

public record ChatMessageResponseDTO (
        String messageId,
        String roomId,
        String senderId,
        String content,
        MessageType messageType,
        LocalDateTime createdAt
){
    public ChatMessageResponseDTO(ChatMessage chatMessage) {
        this (
                chatMessage.getId(),
                chatMessage.getChatRoom().getId(),
                chatMessage.getSender().getId(),
                chatMessage.getContent(),
                chatMessage.getMessageType(),
                chatMessage.getCreatedAt()
        );
    }

    public static ChatMessageResponseDTO requested(String roomId, String senderId, String content, MessageType messageType) {
        return new ChatMessageResponseDTO(
                null,
                roomId,
                senderId,
                content,
                messageType,
                LocalDateTime.now()
        );
    }

}
