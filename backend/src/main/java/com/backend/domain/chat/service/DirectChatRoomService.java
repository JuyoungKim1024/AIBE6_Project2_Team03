package com.backend.domain.chat.service;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DirectChatRoomService {
    private final ChatRoomRepository chatRoomRepository;
    private final ChatParticipantRepository chatParticipantRepository;

    @Transactional
    public ChatRoom getOrCreate(User user1, User user2) {
        return chatParticipantRepository.findDirectRoomByUserIds(user1.getId(), user2.getId())
                .orElseGet(() -> {
                    ChatRoom room = chatRoomRepository.save(new ChatRoom(ChatRoomType.DIRECT));
                    chatParticipantRepository.save(new ChatParticipant(room, user1));
                    chatParticipantRepository.save(new ChatParticipant(room, user2));

                    return room;
                });
    }

}
