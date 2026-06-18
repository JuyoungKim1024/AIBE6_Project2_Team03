package com.backend.domain.project.repository;

import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findTop3ByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(String requesterId, String editorId);

    boolean existsByRoom_IdAndStatusIn(String roomId, List<ProjectStatus> statuses);

    long countByEditor_IdAndStatus(String editorId, ProjectStatus status);
}
