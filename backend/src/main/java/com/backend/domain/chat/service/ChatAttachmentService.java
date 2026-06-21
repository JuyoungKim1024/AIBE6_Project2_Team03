package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatAttachmentResponseDTO;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.type.MessageType;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatAttachmentService {
    private static final long MAX_FILE_SIZE = 50L * 1024 * 1024;
    private static final Set<String> IMAGE_EXTENSIONS = Set.of("jpg", "jpeg", "png", "gif", "webp");
    private static final Set<String> FILE_EXTENSIONS = Set.of(
            "pdf", "txt", "zip", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "mp4", "mov"
    );

    private final ChatParticipantRepository chatParticipantRepository;

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    @Value("${app.base-url:http://localhost:8080}")
    private String baseUrl;

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
        MessageType messageType = resolveMessageType(extension, file.getContentType());
        String storedName = UUID.randomUUID() + "." + extension;
        File directory = resolveUploadDirectory();

        try {
            if (!directory.exists() && !directory.mkdirs()) {
                throw new IOException("업로드 디렉터리를 생성하지 못했습니다.");
            }
            file.transferTo(new File(directory, storedName));
        } catch (IOException exception) {
            throw new IllegalStateException("첨부파일을 저장하지 못했습니다.", exception);
        }

        return new ChatAttachmentResponseDTO(
                baseUrl.replaceAll("/$", "") + "/files/" + storedName,
                originalName,
                file.getSize(),
                file.getContentType() == null ? "application/octet-stream" : file.getContentType(),
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

    private File resolveUploadDirectory() {
        File directory = new File(uploadDir);
        return directory.isAbsolute() ? directory : new File(System.getProperty("user.dir"), uploadDir);
    }
}
