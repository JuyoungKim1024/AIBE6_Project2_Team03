package com.backend.domain.chat.controller;

import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.service.ChatService;
import com.backend.domain.post.entity.Post;
import com.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;

    @PostMapping
    public void saveRoom() {

    }

    @GetMapping
    public List<ChatRoomResponseDTO> findRoomsByUserId (@RequestParam String userId) {
        return chatService.findRoomsByUserId(userId);

    }

    @GetMapping("/{roomId}")
    public ChatRoomResponseDTO findByChatRoom(@PathVariable String roomId) {
        return chatService.findByChatRoomId(roomId);
    }


}
