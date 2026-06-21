package com.backend.domain.notification.service;

import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.service.DirectChatRoomService;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.notification.dto.NotificationResponse;
import com.backend.domain.notification.entity.ProjectNotification;
import com.backend.domain.notification.repository.ProjectNotificationRepository;
import com.backend.domain.point.service.PointService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final MyPageMatchRequestRepository matchRequestRepository;
    private final DirectChatRoomService directChatRoomService;
    private final PointService pointService;
    private final ProjectNotificationRepository projectNotificationRepository;

    // 로그인한 에디터에게 온 WAITING 상태 매칭 요청 목록 반환
    public List<NotificationResponse> getNotifications(String userId) {
        Stream<NotificationResponse> matchingNotifications = matchRequestRepository
                .findByEditor_IdAndStatusOrderByCreatedAtDesc(userId, MatchRequestStatus.WAITING)
                .stream()
                .map(NotificationResponse::from);
        Stream<NotificationResponse> projectNotifications = projectNotificationRepository
                .findByRecipient_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from);

        return Stream.concat(matchingNotifications, projectNotifications)
                .sorted((left, right) -> right.createdAt().compareTo(left.createdAt()))
                .toList();
    }

    @Transactional
    public NotificationResponse accept(String notificationId, String userId) {
        MatchRequest request = findAndValidate(notificationId, userId);
        if (request.getStatus() != MatchRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
        request.accept();
        pointService.holdEscrow(request.getId());

        // 채팅방 생성 및 양측 유저 추가
        ChatRoom room = directChatRoomService.createMatchingRoom(
                request,
                request.getRequester(),
                request.getEditor()
        );

        return NotificationResponse.from(request, room.getId());

    }

    @Transactional
    public NotificationResponse reject(String notificationId, String userId) {
        MatchRequest request = findAndValidate(notificationId, userId);
        request.reject();
        return NotificationResponse.from(request);
    }

    @Transactional
    public NotificationResponse markAsRead(String notificationId, String userId) {
        ProjectNotification notification = projectNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!notification.getRecipient().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        notification.markAsRead();
        return NotificationResponse.from(notification);
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
