package com.backend.domain.project.service;

import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.chat.repository.ChatRoomRepository;
import com.backend.domain.project.dto.ProjectCreateRequestDTO;
import com.backend.domain.project.dto.ProjectResponseDTO;
import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.repository.ProjectRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {
    private final ProjectRepository projectRepository;
    private final ChatRoomRepository chatRoomRepository;
    private final UserRepository userRepository;
    private final ChatParticipantRepository chatParticipantRepository;

    @Transactional
    public ProjectResponseDTO createProject(String userId, ProjectCreateRequestDTO request) {
        ChatRoom room = chatRoomRepository.findById(request.roomId())
                .orElseThrow(() -> new IllegalArgumentException("채팅방을 찾을 수 없습니다."));

        User requester = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        if(!chatParticipantRepository.existsByChatRoom_IdAndUser_Id(room.getId(), userId)) {
            throw new IllegalArgumentException("채팅방 참여자만 프로젝트를 생성할 수 있습니다.");
        }

        boolean exists = projectRepository.existsByRoom_IdAndStatusIn(
                room.getId(),
                List.of(ProjectStatus.WAITING, ProjectStatus.WORKING)
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
                request.videoLength(),
                request.deadline(),
                request.memo()
        );

        return ProjectResponseDTO.from(projectRepository.save(project));
    }
}
