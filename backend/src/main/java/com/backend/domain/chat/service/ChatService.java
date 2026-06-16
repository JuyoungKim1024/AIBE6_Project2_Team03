package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatMessageResponseDTO;
import com.backend.domain.chat.dto.ChatMessageSendRequestDTO;
import com.backend.domain.chat.dto.ChatRoomCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.entity.ChatMessage;
import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatMessageRepository;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly=true)
    public List<ChatRoomResponseDTO> findRoomsByUserId(String userId) {
        return chatParticipantRepository.findByUser_Id(userId)
                .stream()
                .map(ChatParticipant::getChatRoom)
                .map(ChatRoomResponseDTO::new)
                .toList();
    }

    @Transactional
    public ChatRoomResponseDTO createRoom(ChatRoomCreateRequestDTO dto) {
        if(dto.participantUserIds() == null || dto.participantUserIds().isEmpty()) {
            throw new IllegalArgumentException("참여자가 필요합니다.");
        }
        ChatRoom chatRoom = chatRoomRepository.save(new ChatRoom(dto.roomType()));

        List<ChatParticipant> participants = dto.participantUserIds()
                .stream()
                .distinct()
                .map(userId -> userRepository.findById(userId).
                        orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다.")))
                .map(user -> new ChatParticipant(chatRoom, user))
                .toList();

        chatParticipantRepository.saveAll(participants);

        return new ChatRoomResponseDTO(chatRoom);

    }

    @Transactional(readOnly=true)
    public ChatRoomResponseDTO findByChatRoomId(String roomId) {

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        return new ChatRoomResponseDTO(chatRoom);

    }

    @Transactional(readOnly=true)
    public List<ChatMessageResponseDTO> getMessageList(String roomId) {
        return chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageResponseDTO::new)
                .toList();
    }

    @Transactional
    public ChatMessageResponseDTO saveMessage(String roomId, ChatMessageSendRequestDTO dto) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        User sender = userRepository.findById(dto.senderId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if(!chatParticipantRepository.existsByChatRoom_IdAndUser_Id(chatRoom.getId(), sender.getId())) {
            throw new IllegalArgumentException("채팅방 참여자만 메시지를 보낼 수 있습니다.");
        }

        ChatMessage message = new ChatMessage (
                chatRoom,
                sender,
                dto.content(),
                dto.messageType()
        );

        ChatMessage saveMessage = chatMessageRepository.save(message);
        return new ChatMessageResponseDTO(saveMessage);

    }


}
