package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.MessageType;

public record ChatAttachmentResponseDTO(
        String fileUrl,
        String fileName,
        long fileSize,
        String contentType,
        MessageType messageType
) {
}
