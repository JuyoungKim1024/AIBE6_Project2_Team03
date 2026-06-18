package com.backend.domain.project.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.project.dto.ProjectCreateRequestDTO;
import com.backend.domain.project.dto.ProjectResponseDTO;
import com.backend.domain.project.service.ProjectService;
import lombok.RequiredArgsConstructor;
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



}
