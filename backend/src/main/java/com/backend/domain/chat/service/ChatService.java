package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatMessageResponseDTO;
import com.backend.domain.chat.dto.ChatMessageSendRequestDTO;
import com.backend.domain.chat.dto.ChatRoomCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRoomResponseDTO;
import com.backend.domain.chat.dto.ChatUnreadResponseDTO;
import com.backend.domain.chat.entity.ChatMessage;
import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRequest;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatMessageRepository;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRequestRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.chat.type.ChatRequestStatus;
import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.post.entity.Post;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.project.service.ProjectService;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatRequestRepository chatRequestRepository;
    private final UserRepository userRepository;
    private final DirectChatRoomService directChatRoomService;
    private final PostRepository postRepository;
    private final ProjectService projectService;
    private final SimpMessagingTemplate messagingTemplate;


    @Transactional(readOnly = true)
    public List<ChatRoomResponseDTO> findRoomsByUserId(String userId) {
        return chatParticipantRepository.findByUser_IdAndDeletedAtIsNull(userId)
                .stream()
                .map(ChatParticipant::getChatRoom)
                .map(ChatRoomResponseDTO::new)
                .toList();
    }

    // 방 생성 메서드
    @Transactional
    public ChatRoomResponseDTO createRoom(ChatRoomCreateRequestDTO dto) {
        if (dto.participantUserIds() == null || dto.participantUserIds().isEmpty()) {
            throw new IllegalArgumentException("참여자가 필요합니다.");
        }

        if (dto.roomType() == ChatRoomType.DIRECT) {
            if (dto.participantUserIds().size() != 2) {
                throw new IllegalArgumentException("1:1 채팅방은 참여자 2명이 필요합니다.");
            }

            User user1 = userRepository.findById(dto.participantUserIds().get(0))
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
            User user2 = userRepository.findById(dto.participantUserIds().get(1))
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));


            return createDirectRoom(user1, user2);
        }

        ChatRoom chatRoom;

        if(dto.roomType() == ChatRoomType.POST) {
            Post post = postRepository.findById(dto.postId())
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

            chatRoom = chatRoomRepository.save(new ChatRoom(dto.roomType(), post));

        } else {
            chatRoom = chatRoomRepository.save(new ChatRoom(dto.roomType()));
        }


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

    public ChatRoomResponseDTO createDirectRoom(User user1, User user2) {


        Optional<ChatRoom> existingRoom = chatParticipantRepository.findDirectRoomByUserIds(user1.getId(), user2.getId());

        if (existingRoom.isPresent()) {
            return new ChatRoomResponseDTO(existingRoom.get());
        }

        ChatRoom room = directChatRoomService.getOrCreate(user1, user2);

        return new ChatRoomResponseDTO(room);

    }


    // 채팅룸 단건 조회 메서드
    @Transactional(readOnly = true)
    public ChatRoomResponseDTO findByChatRoomId(String roomId) {

        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        return new ChatRoomResponseDTO(chatRoom);
    }

    @Transactional
    public void deleteRoomForUser(String roomId, String userId) {
        leaveRoom(roomId, userId);
    }


    // 채팅 메시지 Read 메서드
    @Transactional(readOnly = true)
    public List<ChatMessageResponseDTO> getMessageList(String roomId) {
        return chatMessageRepository.findByChatRoom_IdOrderByCreatedAtAsc(roomId)
                .stream()
                .map(ChatMessageResponseDTO::new)
                .toList();
    }

    // 메시지 저장 메서드
    @Transactional
    public ChatMessageResponseDTO saveMessage(String roomId, ChatMessageSendRequestDTO dto) {
        ChatRoom chatRoom = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        User sender = userRepository.findById(dto.senderId())
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if (!chatParticipantRepository.existsByChatRoom_IdAndUser_IdAndDeletedAtIsNull(chatRoom.getId(), sender.getId())) {
            throw new IllegalArgumentException("채팅방 참여자만 메시지를 보낼 수 있습니다.");
        }

        ChatParticipant deletedPartner = chatParticipantRepository.findByChatRoom_Id(roomId)
                .stream()
                .filter(participant -> !participant.getUser().getId().equals(sender.getId()))
                .filter(participant -> participant.getDeletedAt() != null)
                .findFirst()
                .orElse(null);

        if (deletedPartner != null) {
            createReopenRequest(sender, deletedPartner.getUser(), dto.content());
            return ChatMessageResponseDTO.requested(roomId, sender.getId(), dto.content(), dto.messageType());
        }

        ChatMessage message = new ChatMessage(
                chatRoom,
                sender,
                dto.content(),
                dto.messageType()
        );

        ChatMessage saveMessage = chatMessageRepository.save(message);
        if (!dto.content().startsWith("__PROJECT_CARD__")) {
            chatParticipantRepository.findByChatRoom_Id(roomId).stream()
                    .filter(participant -> participant.getDeletedAt() == null)
                    .filter(participant -> !participant.getUser().getId().equals(sender.getId()))
                    .forEach(participant -> {
                        participant.incrementUnreadCount();
                        publishUnreadCount(participant.getUser().getId(), roomId, participant.getUnreadCount());
                    });
        }
        return new ChatMessageResponseDTO(saveMessage);

    }

    private void createReopenRequest(User requester, User receiver, String message) {
        boolean existsWaitingRequest = chatRequestRepository.existsByRequester_IdAndReceiver_IdAndPostIsNullAndStatus(
                requester.getId(),
                receiver.getId(),
                ChatRequestStatus.WAITING
        );
        if (existsWaitingRequest) {
            return;
        }

        chatRequestRepository.save(new ChatRequest(
                requester,
                receiver,
                null,
                message
        ));
    }

    @Transactional
    public void leaveRoom(String roomId, String userId) {
        ChatParticipant participant = chatParticipantRepository
                .findByChatRoom_IdAndUser_Id(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        projectService.cancelWaitingProjectByRoom(roomId);

        participant.delete();
    }

    @Transactional
    public ChatUnreadResponseDTO markRoomAsRead(String roomId, String userId) {
        ChatParticipant participant = chatParticipantRepository
                .findByChatRoom_IdAndUser_Id(roomId, userId)
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));
        participant.markAsRead();
        return publishUnreadCount(userId, roomId, 0);
    }

    @Transactional(readOnly = true)
    public ChatUnreadResponseDTO getUnreadCount(String userId) {
        return new ChatUnreadResponseDTO(null, 0, getTotalUnreadCount(userId));
    }

    private ChatUnreadResponseDTO publishUnreadCount(String userId, String roomId, int roomUnreadCount) {
        ChatUnreadResponseDTO response = new ChatUnreadResponseDTO(
                roomId,
                roomUnreadCount,
                getTotalUnreadCount(userId)
        );
        messagingTemplate.convertAndSend("/topic/users/" + userId + "/chat/unread", response);
        return response;
    }

    private int getTotalUnreadCount(String userId) {
        return chatParticipantRepository.findByUser_IdAndDeletedAtIsNull(userId).stream()
                .mapToInt(ChatParticipant::getUnreadCount)
                .sum();
    }


}
