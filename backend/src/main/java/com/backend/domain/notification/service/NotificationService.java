package com.backend.domain.notification.service;

import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.chat.service.DirectChatRoomService;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.notification.dto.NotificationResponse;
import com.backend.domain.notification.entity.ProjectNotification;
import com.backend.domain.notification.repository.ProjectNotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NotificationService {

    private final MyPageMatchRequestRepository matchRequestRepository;
    private final DirectChatRoomService directChatRoomService;
    private final ProjectNotificationRepository projectNotificationRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final SimpMessagingTemplate messagingTemplate;

    // 로그인한 사용자 알림 반환:
    //   - 에디터에게 온 WAITING 매칭 요청
    //   - 크리에이터에게 온 ACCEPTED/REJECTED 매칭 결과
    //   - 프로젝트 알림
    public List<NotificationResponse> getNotifications(String userId) {
        Stream<NotificationResponse> editorMatchingNotifications = matchRequestRepository
                .findByEditor_IdAndStatusAndNotificationDismissedAtIsNullOrderByCreatedAtDesc(
                        userId,
                        MatchRequestStatus.WAITING
                )
                .stream()
                .map(NotificationResponse::from);

        Stream<NotificationResponse> requesterMatchingNotifications = matchRequestRepository
                .findByRequester_IdAndStatusInAndRequesterNotifDismissedAtIsNullOrderByCreatedAtDesc(
                        userId,
                        List.of(MatchRequestStatus.ACCEPTED, MatchRequestStatus.REJECTED)
                )
                .stream()
                .map(r -> {
                    String chatRoomId = r.getStatus() == MatchRequestStatus.ACCEPTED
                            ? chatRoomRepository.findByMatchRequest_Id(r.getId())
                                    .map(ChatRoom::getId)
                                    .orElse(null)
                            : null;
                    return NotificationResponse.fromForRequester(r, chatRoomId);
                });

        Stream<NotificationResponse> projectNotifications = projectNotificationRepository
                .findByRecipient_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(NotificationResponse::from);

        return Stream.of(editorMatchingNotifications, requesterMatchingNotifications, projectNotifications)
                .flatMap(s -> s)
                .sorted((left, right) -> right.createdAt().compareTo(left.createdAt()))
                .toList();
    }

    @Transactional
    public NotificationResponse accept(String notificationId, String userId) {
        MatchRequest request = findAndValidateEditor(notificationId, userId);
        request.accept();

        ChatRoom room = directChatRoomService.createMatchingRoom(
                request,
                request.getRequester(),
                request.getEditor()
        );

        // 커밋 후 크리에이터에게 수락 알림 WebSocket 발송
        String requesterId = request.getRequester().getId();
        String roomId = room.getId();
        NotificationResponse requesterNotif = NotificationResponse.fromForRequester(request, roomId);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend(
                        "/topic/users/" + requesterId + "/notifications",
                        requesterNotif
                );
            }
        });

        return NotificationResponse.from(request, roomId);
    }

    @Transactional
    public NotificationResponse reject(String notificationId, String userId) {
        MatchRequest request = findAndValidateEditor(notificationId, userId);
        request.reject();

        // 커밋 후 크리에이터에게 거절 알림 WebSocket 발송
        String requesterId = request.getRequester().getId();
        NotificationResponse requesterNotif = NotificationResponse.fromForRequester(request, null);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend(
                        "/topic/users/" + requesterId + "/notifications",
                        requesterNotif
                );
            }
        });

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

    @Transactional
    public void delete(String notificationId, String userId) {
        // ProjectNotification 삭제
        ProjectNotification projectNotification = projectNotificationRepository.findById(notificationId).orElse(null);
        if (projectNotification != null) {
            if (!projectNotification.getRecipient().getId().equals(userId)) {
                throw new IllegalArgumentException("권한이 없습니다.");
            }
            projectNotificationRepository.delete(projectNotification);
            return;
        }

        // MatchRequest 알림 dismiss — 에디터(수신) 또는 크리에이터(수락/거절 결과) 모두 처리
        MatchRequest request = matchRequestRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));

        if (request.getEditor().getId().equals(userId)) {
            request.dismissNotification();
        } else if (request.getRequester().getId().equals(userId)) {
            request.dismissRequesterNotification();
        } else {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
    }

    private MatchRequest findAndValidateEditor(String notificationId, String userId) {
        MatchRequest request = matchRequestRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("알림을 찾을 수 없습니다."));
        if (!request.getEditor().getId().equals(userId)) {
            throw new IllegalArgumentException("권한이 없습니다.");
        }
        return request;
    }
}
