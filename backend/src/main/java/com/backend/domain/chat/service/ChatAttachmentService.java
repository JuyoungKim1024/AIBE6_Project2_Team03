package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatAttachmentResponseDTO;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.type.MessageType;
import com.backend.domain.editor.service.R2UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.exception.SdkException;

import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ChatAttachmentService {
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024;
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> FILE_EXTENSIONS = Set.of(
            "pdf", "txt", "zip", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "mp4", "mov"
    );

    private final ChatParticipantRepository chatParticipantRepository;
    private final R2UploadService r2UploadService;

    public ChatAttachmentResponseDTO upload(String roomId, String userId, MultipartFile file) {
        if (!chatParticipantRepository.existsByChatRoom_IdAndUser_IdAndDeletedAtIsNull(roomId, userId)) {
            throw new IllegalArgumentException("채팅방 참여자만 파일을 첨부할 수 있습니다.");
        }
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("첨부할 파일을 선택해주세요.");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("첨부파일은 50MB 이하만 업로드할 수 있습니다.");
        }

        String originalName = sanitizeFileName(file.getOriginalFilename());
        String extension = getExtension(originalName);
        String contentType = file.getContentType() == null
                ? "application/octet-stream"
                : file.getContentType();
        MessageType messageType = resolveMessageType(extension, contentType);
        String fileUrl;

        try {
            // 채팅방별 R2 경로에 저장해 다른 채팅방 및 다른 종류의 파일과 구분한다.
            fileUrl = r2UploadService.upload(file, "chat/" + roomId);
        } catch (IOException | SdkException exception) {
            throw new IllegalStateException("첨부파일을 R2에 저장하지 못했습니다.", exception);
        }

        return new ChatAttachmentResponseDTO(
                fileUrl,
                originalName,
                file.getSize(),
                contentType,
                messageType
        );
    }

    private String sanitizeFileName(String originalName) {
        String fileName = originalName == null ? "attachment" : Path.of(originalName).getFileName().toString();
        if (fileName.isBlank() || fileName.length() > 255 || !fileName.contains(".")) {
            throw new IllegalArgumentException("올바른 파일명이 필요합니다.");
        }
        return fileName;
    }

    private String getExtension(String fileName) {
        return fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT);
    }

    private MessageType resolveMessageType(String extension, String contentType) {
        if (IMAGE_EXTENSIONS.contains(extension) && contentType != null && contentType.startsWith("image/")) {
            return MessageType.IMAGE;
        }
        if (FILE_EXTENSIONS.contains(extension)) {
            return MessageType.FILE;
        }
        throw new IllegalArgumentException("지원하지 않는 파일 형식입니다.");
    }
}
