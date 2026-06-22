package com.backend.domain.project.repository;

import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends JpaRepository<Project, String> {

    @Query("SELECT p FROM Project p JOIN FETCH p.requester JOIN FETCH p.editor WHERE p.id = :id")
    Optional<Project> findByIdWithParticipants(@Param("id") String id);
    List<Project> findTop3ByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(String requesterId, String editorId);

    boolean existsByRoom_IdAndStatusIn(String roomId, List<ProjectStatus> statuses);

    Project findTopByRoom_IdAndStatusInOrderByCreatedAtDesc(String roomId, List<ProjectStatus> statuses);

    long countByEditor_IdAndStatus(String editorId, ProjectStatus status);

    List<Project> findByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(String requesterId, String editorId);

    @Query("""
        SELECT p
        FROM Project p
        JOIN ChatParticipant cp ON cp.chatRoom = p.room
        WHERE cp.user.id = :userId
        AND cp.deletedAt IS NULL
        ORDER BY p.updatedAt DESC
    """)
    List<Project> findVisibleProjectsByUserId(@Param("userId") String userId);

    @Query("SELECT p FROM Project p WHERE (p.editor.id = :userId OR p.requester.id = :userId) AND p.status = 'COMPLETED' ORDER BY p.createdAt DESC")
    List<Project> findCompletedByUser(@Param("userId") String userId);
}
