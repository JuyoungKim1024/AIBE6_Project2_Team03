package com.backend.domain.chat.service;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.post.entity.Post;
import com.backend.domain.user.entity.User;
import com.backend.domain.mypage.entity.MatchRequest;
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
                .map(room -> {
                    restoreParticipant(room, user1);
                    restoreParticipant(room, user2);
                    return room;
                })
                .orElseGet(() -> {
                    ChatRoom room = chatRoomRepository.save(new ChatRoom(ChatRoomType.DIRECT));
                    chatParticipantRepository.save(new ChatParticipant(room, user1));
                    chatParticipantRepository.save(new ChatParticipant(room, user2));
                    return room;
                });
    }

    @Transactional
    public ChatRoom getOrCreatePostRoom(Post post, User user1, User user2) {
        return chatParticipantRepository.findPostRoomByPostIdAndUserIds(post.getId(), user1.getId(), user2.getId())
                .map(room -> {
                    restoreParticipant(room, user1);
                    restoreParticipant(room, user2);
                    return room;
                })
                .orElseGet(() -> {
                    ChatRoom room = chatRoomRepository.save(new ChatRoom(ChatRoomType.POST, post));
                    chatParticipantRepository.save(new ChatParticipant(room, user1));
                    chatParticipantRepository.save(new ChatParticipant(room, user2));
                    return room;
                });
    }

    @Transactional
    public ChatRoom createMatchingRoom(MatchRequest matchRequest, User requester, User editor) {
        ChatRoom room = chatRoomRepository.save(new ChatRoom(matchRequest));
        chatParticipantRepository.save(new ChatParticipant(room, requester));
        chatParticipantRepository.save(new ChatParticipant(room, editor));
        return room;
    }

    public void restoreParticipant(ChatRoom room, User user) {
        chatParticipantRepository.findByChatRoom_IdAndUser_Id(room.getId(), user.getId())
                .ifPresent(ChatParticipant::restore);
    }

}
