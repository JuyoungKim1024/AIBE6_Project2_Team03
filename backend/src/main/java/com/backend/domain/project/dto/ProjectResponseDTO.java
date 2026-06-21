package com.backend.domain.project.dto;

import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.entity.ProjectWorkUnit;

import java.time.LocalDateTime;

public record ProjectResponseDTO(
        String id,
        String roomId,
        String requesterId,
        String editorId,
        String field,
        Integer price,
        Integer workAmount,
        ProjectWorkUnit workUnit,
        int revisionCount,
        LocalDateTime deadline,
        String memo,
        ProjectStatus status,
        String completionRequestedBy

) {
    public static ProjectResponseDTO from(Project project) {
        return new ProjectResponseDTO(
                project.getId(),
                project.getRoom().getId(),
                project.getRequester().getId(),
                project.getEditor().getId(),
                project.getField(),
                project.getPrice(),
                project.getWorkAmount(),
                project.getWorkUnit(),
                project.getRevisionCount(),
                project.getDeadline(),
                project.getMemo(),
                project.getStatus(),
                project.getCompletionRequestedBy()
        );
    }

}
