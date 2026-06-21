package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.MessageType;

public record ChatMessageSendRequestDTO (
        String senderId,
        String content,
        MessageType messageType,
        String fileUrl,
        String fileName,
        Long fileSize,
        String contentType
){

}
