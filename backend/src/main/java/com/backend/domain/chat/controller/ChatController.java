package com.backend.domain.chat.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.dto.ChatMessageResponseDTO;
import com.backend.domain.chat.dto.ChatMessageSendRequestDTO;
import com.backend.domain.chat.dto.ChatRoomCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.dto.ChatUnreadResponseDTO;
import com.backend.domain.chat.dto.ChatAttachmentResponseDTO;
import com.backend.domain.chat.service.ChatAttachmentService;
import com.backend.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthService authService;
    private final ChatAttachmentService chatAttachmentService;

    @GetMapping
    public List<ChatRoomResponseDTO> findMyRooms(
            @RequestHeader("Authorization") String authorization
    ) {
        String userId = authService.resolveUserId(authorization);
        return chatService.findRoomsByUserId(userId);
    }

    @PostMapping
    public ChatRoomResponseDTO createRoom(@RequestBody ChatRoomCreateRequestDTO dto) {
        return chatService.createRoom(dto);
    }

    @GetMapping("/{roomId}")
    public ChatRoomResponseDTO findByChatRoom(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String roomId
    ) {
        authService.resolveUserId(authorization);
        return chatService.findByChatRoomId(roomId);
    }

    @DeleteMapping("/{roomId}")
    public void deleteRoom(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String roomId
    ) {
        String userId = authService.resolveUserId(authorizationHeader);
        chatService.leaveRoom(roomId, userId);
    }

    @GetMapping("/{roomId}/messages")
    public List<ChatMessageResponseDTO> findByChatRoomMessage(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String roomId
    ) {
        authService.resolveUserId(authorization);
        return chatService.getMessageList(roomId);
    }

    @GetMapping("/unread-count")
    public ChatUnreadResponseDTO getUnreadCount(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        return chatService.getUnreadCount(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/{roomId}/read")
    public ChatUnreadResponseDTO markRoomAsRead(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String roomId
    ) {
        return chatService.markRoomAsRead(roomId, authService.resolveUserId(authorizationHeader));
    }

    @PostMapping("/{roomId}/messages")
    public ChatMessageResponseDTO saveMessage(@PathVariable String roomId, @RequestBody ChatMessageSendRequestDTO dto) {
        return chatService.saveMessage(roomId, dto);
    }

    @PostMapping("/{roomId}/attachments")
    public ChatAttachmentResponseDTO uploadAttachment(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String roomId,
            @RequestParam("file") MultipartFile file
    ) {
        return chatAttachmentService.upload(
                roomId,
                authService.resolveUserId(authorizationHeader),
                file
        );
    }

    @MessageMapping("/chat/rooms/{roomId}/messages")
    public void sendMessage(@DestinationVariable String roomId, @Payload ChatMessageSendRequestDTO dto) {
        ChatMessageResponseDTO response = chatService.saveMessage(roomId, dto);
        messagingTemplate.convertAndSend("/topic/chat/rooms/" + roomId, response);
    }
}
