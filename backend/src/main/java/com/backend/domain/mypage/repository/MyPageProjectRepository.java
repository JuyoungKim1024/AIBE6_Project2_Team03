package com.backend.domain.mypage.repository;

import com.backend.domain.project.entity.Project;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MyPageProjectRepository extends JpaRepository<Project, String> {
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
}
