package com.backend.domain.chat.service;

import com.backend.domain.chat.dto.ChatRequestCreateRequestDTO;
import com.backend.domain.chat.dto.ChatRequestResponseDTO;
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
import com.backend.domain.chat.type.MessageType;
import com.backend.domain.post.entity.Post;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ChatRequestService {

    private final ChatRequestRepository chatRequestRepository;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final DirectChatRoomService directChatRoomService;

    @Transactional
    public ChatRequestResponseDTO createRequest(String requesterId, ChatRequestCreateRequestDTO dto) {
         User requester = userRepository.findById(requesterId)
                 .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
         User receiver = userRepository.findById(dto.receiverId())
                 .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
         boolean isDirectRequest = dto.roomType() == ChatRoomType.DIRECT;
         Post post = isDirectRequest || dto.postId() == null || dto.postId().isBlank()
                 ? null
                 : postRepository.findById(dto.postId())
                    .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));


         if(requester.getId().equals(receiver.getId())) {
             throw new IllegalArgumentException("본인에게는 채팅을 보낼 수 없습니다.");
         }

         boolean existsWaitingRequest = post == null
                 ? chatRequestRepository.existsByRequester_IdAndReceiver_IdAndPostIsNullAndStatus(
                    requester.getId(),
                    receiver.getId(),
                    ChatRequestStatus.WAITING
                 )
                 : chatRequestRepository.existsByRequester_IdAndReceiver_IdAndPost_IdAndStatus(
                    requester.getId(),
                    receiver.getId(),
                    post.getId(),
                    ChatRequestStatus.WAITING
                 );

         if (existsWaitingRequest) {
             throw new IllegalStateException("이미 대기 중인 채팅 요청이 있습니다.");
         }

        ChatRequest chatRequest = new ChatRequest(
                requester,
                receiver,
                post,
                dto.message()
        );

         ChatRequest saved = chatRequestRepository.save(chatRequest);


         return ChatRequestResponseDTO.from(saved);


    }

    @Transactional
    public ChatRequestResponseDTO acceptRequest(String requestId, String receiverId) {
        ChatRequest request = findAndValidateReceiver(requestId, receiverId);
        if (request.getStatus() != ChatRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 채팅 요청입니다.");
        }

        ChatRoom chatRoom;
        if (request.getPost() == null) {
            chatRoom = directChatRoomService.getOrCreate(request.getRequester(), request.getReceiver());
        } else {
            chatRoom = directChatRoomService.getOrCreatePostRoom(
                    request.getPost(),
                    request.getRequester(),
                    request.getReceiver()
            );
        }
        ChatMessage firstMessage = new ChatMessage(
                chatRoom,
                request.getRequester(),
                request.getMessage(),
                MessageType.TEXT
        );

        chatMessageRepository.save(firstMessage);

        request.accept(chatRoom);
        return ChatRequestResponseDTO.from(request);
    }

    @Transactional
    public ChatRequestResponseDTO rejectRequest(String requestId, String receiverId) {
        ChatRequest request = findAndValidateReceiver(requestId, receiverId);
        if (request.getStatus() != ChatRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 채팅 요청입니다.");
        }

        request.reject();
        return ChatRequestResponseDTO.from(request);
    }

    private ChatRequest findAndValidateReceiver(String requestId, String receiverId) {
        ChatRequest request = chatRequestRepository.findById(requestId)
                .orElseThrow(() -> new IllegalArgumentException("채팅 요청을 찾을 수 없습니다."));
        if (!request.getReceiver().getId().equals(receiverId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        return request;
    }

    @Transactional(readOnly = true)
    public List<ChatRequestResponseDTO> getReceivedRequests(String receiverId) {
        return chatRequestRepository
                .findByReceiver_IdAndStatusAndNotificationDismissedAtIsNullOrderByCreatedAtDesc(
                        receiverId,
                        ChatRequestStatus.WAITING
                )
                .stream()
                .map(ChatRequestResponseDTO::from)
                .toList();
    }

    @Transactional
    public void deleteNotification(String requestId, String receiverId) {
        ChatRequest request = findAndValidateReceiver(requestId, receiverId);
        request.dismissNotification();
    }

}
