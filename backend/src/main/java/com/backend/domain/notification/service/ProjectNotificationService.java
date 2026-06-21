package com.backend.domain.notification.service;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.notification.dto.NotificationResponse;
import com.backend.domain.notification.entity.ProjectNotification;
import com.backend.domain.notification.entity.ProjectNotificationType;
import com.backend.domain.notification.repository.ProjectNotificationRepository;
import com.backend.domain.project.entity.Project;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ProjectNotificationService {
    private final ProjectNotificationRepository projectNotificationRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public void notify(Project project, String actorId, ProjectNotificationType type) {
        ChatParticipant recipient = chatParticipantRepository.findByChatRoom_Id(project.getRoom().getId()).stream()
                .filter(participant -> participant.getDeletedAt() == null)
                .filter(participant -> !participant.getUser().getId().equals(actorId))
                .findFirst()
                .orElse(null);
        if (recipient == null) return;

        ChatParticipant actor = chatParticipantRepository.findByChatRoom_Id(project.getRoom().getId()).stream()
                .filter(participant -> participant.getUser().getId().equals(actorId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("프로젝트 참여자를 찾을 수 없습니다."));

        ProjectNotification saved = projectNotificationRepository.save(
                new ProjectNotification(recipient.getUser(), actor.getUser(), project, type)
        );
        messagingTemplate.convertAndSend(
                "/topic/users/" + recipient.getUser().getId() + "/notifications",
                NotificationResponse.from(saved)
        );
    }
}
