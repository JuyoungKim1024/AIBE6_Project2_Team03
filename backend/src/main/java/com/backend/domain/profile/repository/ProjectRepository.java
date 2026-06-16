package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.Project;
import com.backend.domain.profile.entity.ProjectStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProjectRepository extends JpaRepository<Project, String> {
    List<Project> findTop3ByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(String requesterId, String editorId);

    long countByEditor_IdAndStatus(String editorId, ProjectStatus status);
}
