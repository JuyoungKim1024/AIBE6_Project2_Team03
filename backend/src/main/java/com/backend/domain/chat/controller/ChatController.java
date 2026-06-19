package com.backend.domain.chat.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.dto.ChatMessageResponseDTO;
import com.backend.domain.chat.dto.ChatMessageSendRequestDTO;
import com.backend.domain.chat.dto.ChatRoomCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.service.ChatService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final AuthService authService;

    @GetMapping
    public List<ChatRoomResponseDTO> findRoomsByUserId (@RequestParam String userId) {
        return chatService.findRoomsByUserId(userId);
    }

    @PostMapping
    public ChatRoomResponseDTO createRoom(@RequestBody ChatRoomCreateRequestDTO dto) {
        return chatService.createRoom(dto);
    }

    @GetMapping("/{roomId}")
    public ChatRoomResponseDTO findByChatRoom(@PathVariable String roomId) {
        return chatService.findByChatRoomId(roomId);
    }

    @DeleteMapping("/{roomId}")
    public void deleteRoom(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String roomId
    ) {
        String userId = authService.resolveUserId(authorizationHeader);
        chatService.deleteRoomForUser(roomId, userId);
    }

    @GetMapping("/{roomId}/messages")
    public List<ChatMessageResponseDTO> findByChatRoomMessage(@PathVariable String roomId) {
        return chatService.getMessageList(roomId);
    }

    @PostMapping("/{roomId}/messages")
    public ChatMessageResponseDTO saveMessage(@PathVariable String roomId, @RequestBody ChatMessageSendRequestDTO dto) {
        return chatService.saveMessage(roomId, dto);
    }

    @MessageMapping("/chat/rooms/{roomId}/messages")
    public void sendMessage(@DestinationVariable String roomId, @Payload ChatMessageSendRequestDTO dto) {
        ChatMessageResponseDTO response = chatService.saveMessage(roomId, dto);
        messagingTemplate.convertAndSend("/topic/chat/rooms/" + roomId, response);
    }
}
