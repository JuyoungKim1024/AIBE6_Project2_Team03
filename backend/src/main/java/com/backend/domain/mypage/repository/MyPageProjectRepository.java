package com.backend.domain.mypage.repository;

import com.backend.domain.profile.entity.Project;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPageProjectRepository extends JpaRepository<Project, String> {
    List<Project> findByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(String requesterId, String editorId);
}
