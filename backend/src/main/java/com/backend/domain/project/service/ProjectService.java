package com.backend.domain.project.service;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.dispute.entity.DisputeStatus;
import com.backend.domain.dispute.repository.DisputeRepository;
import com.backend.domain.point.service.PointService;
import com.backend.domain.project.dto.ProjectCreateRequestDTO;
import com.backend.domain.project.dto.ProjectResponseDTO;
import com.backend.domain.project.dto.ProjectUpdateRequestDTO;
import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.entity.ProjectWorkUnit;
import com.backend.domain.project.repository.ProjectRepository;
import com.backend.domain.notification.entity.ProjectNotificationType;
import com.backend.domain.notification.service.ProjectNotificationService;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatParticipantRepository chatParticipantRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final PointService pointService;
    private final DisputeRepository disputeRepository;
    private final ProjectNotificationService projectNotificationService;

    private ProjectResponseDTO publishProject(Project project) {
        // 트랜잭션 커밋 전에 WebSocket을 보내면 프론트엔드가 구버전 데이터를 읽는 race condition 발생
        // → snapshot을 미리 만들고 커밋 후에 전송
        ProjectResponseDTO response = ProjectResponseDTO.from(project);
        String roomId = project.getRoom().getId();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                messagingTemplate.convertAndSend(
                        "/topic/chat/rooms/" + roomId + "/project",
                        response
                );
            }
        });
        return response;
    }

    private ProjectResponseDTO publishProjectChange(
            Project project,
            String changedByUserId,
            ProjectNotificationType notificationType
    ) {
        ProjectResponseDTO response = publishProject(project);
        // notify()도 afterCommit에서 실행해야 WebSocket이 DB 커밋 이후에 전송된다.
        // (publishProject와 동일한 이유: 커밋 전 발송 시 프론트 polling이 구버전 데이터를 읽는 race condition)
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                projectNotificationService.notify(project, changedByUserId, notificationType);
            }
        });
        return response;
    }

    @Transactional
    public void cancelWaitingProjectByRoom(String roomId) {
        Project project = projectRepository.findTopByRoom_IdAndStatusInOrderByCreatedAtDesc(
                roomId,
                List.of(ProjectStatus.WAITING)
        );

        if(project == null) return;

        project.cancel();
        publishProject(project);

    }

    @Transactional
    public ProjectResponseDTO createProject(String userId, ProjectCreateRequestDTO request) {
        validateRequiredFields(request.field(), request.price(), request.workAmount(), request.workUnit(), request.revisionCount(), request.revisionUnlimited(), request.deadline());

        ChatRoom room = chatRoomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if(!chatParticipantRepository.existsByChatRoom_IdAndUser_Id(room.getId(), userId)) {
            throw new IllegalArgumentException("채팅방 참여자만 프로젝트를 생성할 수 있습니다.");
        }

        boolean exists = projectRepository.existsByRoom_IdAndStatusIn(
                room.getId(),
                List.of(
                        ProjectStatus.WAITING,
                        ProjectStatus.WORKING,
                        ProjectStatus.COMPLETION_PENDING,
                        ProjectStatus.CANCELLATION_PENDING
                )
        );

        if(exists) {
            throw new IllegalArgumentException("이미 진행 중인 프로젝트가 있습니다.");
        }

        User editor = chatParticipantRepository.findByChatRoom_Id(room.getId())
                .stream()
                .map(ChatParticipant::getUser)
                .filter(user -> !user.getId().equals(userId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("상대 사용자를 찾을 수 없습니다."));


        Project project = new Project (
                room,
                requester,
                editor,
                request.field(),
                request.price(),
                request.workAmount(),
                request.workUnit(),
                request.revisionCount() == null ? 0 : request.revisionCount(),
                request.revisionUnlimited(),
                request.deadline(),
                request.memo()
        );

        Project saved = projectRepository.save(project);
        return publishProjectChange(saved, userId, ProjectNotificationType.PROJECT_REQUESTED);
    }

    @Transactional(readOnly = true)
    public Optional<ProjectResponseDTO> getProjectByRoom(String userId, String roomId) {
        if (!chatParticipantRepository.existsByChatRoom_IdAndUser_Id(roomId, userId)) {
            throw new IllegalArgumentException("채팅방 참여자만 프로젝트를 조회할 수 있습니다.");
        }

        Project project = projectRepository.findTopByRoom_IdAndStatusInOrderByCreatedAtDesc(
                roomId,
                List.of(
                        ProjectStatus.WAITING,
                        ProjectStatus.WORKING,
                        ProjectStatus.COMPLETION_PENDING,
                        ProjectStatus.CANCELLATION_PENDING,
                        ProjectStatus.COMPLETED,
                        ProjectStatus.CANCELED,
                        ProjectStatus.REJECTED
                )
        );
        return Optional.ofNullable(project).map(ProjectResponseDTO::from);
    }

    @Transactional
    public ProjectResponseDTO updateProject(String userId, String projectId, ProjectUpdateRequestDTO request) {
        validateRequiredFields(request.field(), request.price(), request.workAmount(), request.workUnit(), request.revisionCount(), request.revisionUnlimited(), request.deadline());

        Project project = getProject(projectId);
        validateRequester(project, userId);
        if (isClosed(project)) {
            throw new IllegalArgumentException("이미 종료된 프로젝트입니다.");
        }

        project.update(
                request.field(),
                request.price(),
                request.workAmount(),
                request.workUnit(),
                request.revisionCount() == null ? 0 : request.revisionCount(),
                request.revisionUnlimited(),
                request.deadline(),
                request.memo()
        );
        return publishProjectChange(project, userId, ProjectNotificationType.PROJECT_UPDATED);
    }

    @Transactional
    public ProjectResponseDTO startProject(String userId, String projectId) {
        Project project = getProject(projectId);
        validateEditor(project, userId);
        validateStatus(project, ProjectStatus.WAITING);
        // 안전결제 보관 먼저: 포인트 부족이면 여기서 실패해야 status가 오염되지 않음
        pointService.holdSafePaymentForProject(project);
        project.start();
        return publishProjectChange(project, userId, ProjectNotificationType.PROJECT_ACCEPTED);
    }

    @Transactional
    public ProjectResponseDTO rejectProject(String userId, String projectId) {
        Project project = getProject(projectId);
        validateEditor(project, userId);
        validateStatus(project, ProjectStatus.WAITING);
        project.reject();
        return publishProjectChange(project, userId, ProjectNotificationType.PROJECT_REJECTED);
    }

    @Transactional
    public ProjectResponseDTO completeProject(String userId, String projectId) {
        Project project = getProject(projectId);
        validateParticipant(project, userId);
        validateNoActiveDispute(project);
        project.requestComplete(userId);
        if (project.getStatus() == ProjectStatus.COMPLETED) {
            pointService.releaseSafePaymentForProject(project);
        }
        ProjectNotificationType notificationType = project.getStatus() == ProjectStatus.COMPLETION_PENDING
                ? ProjectNotificationType.PROJECT_COMPLETION_REQUESTED
                : ProjectNotificationType.PROJECT_COMPLETED;
        return publishProjectChange(project, userId, notificationType);
    }

    @Transactional
    public ProjectResponseDTO cancelProject(String userId, String projectId) {
        Project project = getProject(projectId);
        validateParticipant(project, userId);
        validateNoActiveDispute(project);
        project.requestCancel(userId);
        ProjectNotificationType notificationType = project.getStatus() == ProjectStatus.CANCELLATION_PENDING
                ? ProjectNotificationType.PROJECT_CANCELLATION_REQUESTED
                : ProjectNotificationType.PROJECT_CANCELED;
        if (project.getStatus() == ProjectStatus.CANCELED && project.isSafePaymentHeld()) {
            pointService.refundSafePaymentForProject(project);
        }
        return publishProjectChange(project, userId, notificationType);
    }

    private Project getProject(String projectId) {
        return projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
    }

    private void validateRequiredFields(
            String field,
            Integer price,
            Integer workAmount,
            ProjectWorkUnit workUnit,
            Integer revisionCount,
            boolean revisionUnlimited,
            java.time.LocalDateTime deadline
    ) {
        if (field == null || field.isBlank()) {
            throw new IllegalArgumentException("작업 분야를 입력해주세요.");
        }
        if (price == null) {
            throw new IllegalArgumentException("금액을 입력해주세요.");
        }
        if (workAmount == null) {
            throw new IllegalArgumentException("작업량을 입력해주세요.");
        }
        if (workUnit == null) {
            throw new IllegalArgumentException("작업량 단위를 선택해주세요.");
        }
        if (!revisionUnlimited && revisionCount == null) {
            throw new IllegalArgumentException("수정 횟수를 입력해주세요.");
        }
        if (revisionCount != null && revisionCount < 0) {
            throw new IllegalArgumentException("수정 횟수는 0 이상이어야 합니다.");
        }
        if (deadline == null) {
            throw new IllegalArgumentException("마감일을 입력해주세요.");
        }
    }

    private void validateEditor(Project project, String userId) {
        if (!project.getEditor().getId().equals(userId)) {
            throw new IllegalArgumentException("상대방만 수락 또는 거절할 수 있습니다.");
        }
        validateParticipant(project, userId);
    }

    private void validateRequester(Project project, String userId) {
        if (!project.getRequester().getId().equals(userId)) {
            throw new IllegalArgumentException("프로젝트 생성자만 수정할 수 있습니다.");
        }
        validateParticipant(project, userId);
    }

    private void validateParticipant(Project project, String userId) {
        if (!project.getRequester().getId().equals(userId) && !project.getEditor().getId().equals(userId)) {
            throw new IllegalArgumentException("프로젝트 참여자만 변경할 수 있습니다.");
        }
        if (!chatParticipantRepository.existsByChatRoom_IdAndUser_Id(project.getRoom().getId(), userId)) {
            throw new IllegalArgumentException("채팅방 참여자만 프로젝트를 변경할 수 있습니다.");
        }
    }

    private void validateStatus(Project project, ProjectStatus status) {
        if (project.getStatus() != status) {
            throw new IllegalArgumentException("변경할 수 없는 프로젝트 상태입니다.");
        }
    }

    private boolean isClosed(Project project) {
        return project.getStatus() == ProjectStatus.COMPLETED
                || project.getStatus() == ProjectStatus.CANCELED
                || project.getStatus() == ProjectStatus.REJECTED;
    }

    private void validateNoActiveDispute(Project project) {
        // AI_FAILED / REJECTED 는 종료된 분쟁이므로 프로젝트 조작 허용
        boolean hasActiveDispute = disputeRepository.existsByProject_IdAndStatusIn(
                project.getId(),
                List.of(DisputeStatus.AI_PENDING, DisputeStatus.AI_JUDGED)
        );
        if (hasActiveDispute) {
            throw new IllegalStateException("진행 중인 분쟁이 있어 프로젝트를 변경할 수 없습니다.");
        }
    }
}
