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
        String fileUrl,
        String fileName,
        Long fileSize,
        String contentType,
        LocalDateTime createdAt
){
    public ChatMessageResponseDTO(ChatMessage chatMessage) {
        this (
                chatMessage.getId(),
                chatMessage.getChatRoom().getId(),
                chatMessage.getSender().getId(),
                chatMessage.getContent(),
                chatMessage.getMessageType(),
                chatMessage.getFileUrl(),
                chatMessage.getFileName(),
                chatMessage.getFileSize(),
                chatMessage.getContentType(),
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
                null,
                null,
                null,
                null,
                LocalDateTime.now()
        );
    }

}
