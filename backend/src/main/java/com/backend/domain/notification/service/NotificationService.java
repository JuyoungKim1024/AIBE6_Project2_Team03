package com.backend.domain.notification.service;

import com.backend.domain.mypage.entity.ChatRoom;
import com.backend.domain.mypage.entity.ChatRoomUser;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.ChatRoomRepository;
import com.backend.domain.mypage.repository.MyPageChatRoomUserRepository;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.notification.dto.NotificationResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final MyPageMatchRequestRepository matchRequestRepository;
    private final MyPageChatRoomUserRepository chatRoomUserRepository;
    private final ChatRoomRepository chatRoomRepository;

    // 로그인한 에디터에게 온 WAITING 상태 매칭 요청 목록 반환
    public List<NotificationResponse> getNotifications(String userId) {
        return matchRequestRepository
                .findByEditor_IdAndStatusOrderByCreatedAtDesc(userId, MatchRequestStatus.WAITING)
                .stream()
                .map(NotificationResponse::from)
                .toList();
    }

    @Transactional
    public NotificationResponse accept(String notificationId, String userId) {
        MatchRequest request = findAndValidate(notificationId, userId);
        if (request.getStatus() != MatchRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
        request.accept();

        // 채팅방 생성 및 양측 유저 추가
        ChatRoom room = chatRoomRepository.save(new ChatRoom(ChatRoom.RoomType.DIRECT));
        chatRoomUserRepository.save(new ChatRoomUser(room, request.getRequester()));
        chatRoomUserRepository.save(new ChatRoomUser(room, request.getEditor()));

        return NotificationResponse.from(request, room.getId());
    }

    @Transactional
    public NotificationResponse reject(String notificationId, String userId) {
        MatchRequest request = findAndValidate(notificationId, userId);
        request.reject();
        return NotificationResponse.from(request);
    }

    private MatchRequest findAndValidate(String notificationId, String userId) {
        MatchRequest request = matchRequestRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!request.getEditor().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        return request;
    }

}
