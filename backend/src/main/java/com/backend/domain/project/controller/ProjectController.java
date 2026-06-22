package com.backend.domain.project.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.project.dto.ProjectCreateRequestDTO;
import com.backend.domain.project.dto.ProjectResponseDTO;
import com.backend.domain.project.dto.ProjectUpdateRequestDTO;
import com.backend.domain.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;
    private final AuthService authService;

    @PostMapping
    public ProjectResponseDTO createProject(
            @RequestHeader("Authorization") String authorization,
            @RequestBody ProjectCreateRequestDTO request
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.createProject(userId, request);
    }

    @GetMapping("/rooms/{roomId}")
    public ResponseEntity<ProjectResponseDTO> getProjectByRoom(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String roomId
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.getProjectByRoom(userId, roomId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.noContent().build());
    }

    @PatchMapping("/{projectId}")
    public ProjectResponseDTO updateProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId,
            @RequestBody ProjectUpdateRequestDTO request
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.updateProject(userId, projectId, request);
    }

    @PatchMapping("/{projectId}/start")
    public ProjectResponseDTO startProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.startProject(userId, projectId);
    }

    @PatchMapping("/{projectId}/reject")
    public ProjectResponseDTO rejectProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.rejectProject(userId, projectId);
    }

    @PatchMapping("/{projectId}/complete")
    public ProjectResponseDTO completeProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.completeProject(userId, projectId);
    }

    @PatchMapping("/{projectId}/cancel")
    public ProjectResponseDTO cancelProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId
    ) {
        String userId = authService.resolveUserId(authorization);
        return projectService.cancelProject(userId, projectId);
    }
}
