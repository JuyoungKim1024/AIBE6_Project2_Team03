package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatMessageRepository;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collector;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;

    @Transactional(readOnly=true)
    public List<ChatRoomResponseDTO> findRoomsByUserId(String userId) {
        return chatParticipantRepository.findByUser_Id(userId)
                .stream()
                .map(ChatParticipant::getChatRoom)
                .map(ChatRoomResponseDTO::new)
                .toList();

    }

    @Transactional(readOnly=true)
    public ChatRoomResponseDTO findByChatRoomId(String roomId) {

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        return new ChatRoomResponseDTO(chatRoom);
    }
}
