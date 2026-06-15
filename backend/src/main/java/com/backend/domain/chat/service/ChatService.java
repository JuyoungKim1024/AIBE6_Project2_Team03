package com.backend.domain.chat.service;

import com.backend.domain.mypage.repository.MyPageChatRoomUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ChatService {

    private final MyPageChatRoomUserRepository chatRoomUserRepository;

    public int getUnreadCount(String userId) {
        return chatRoomUserRepository.sumUnreadCountByUserId(userId);
    }
}
