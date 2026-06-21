package com.backend.domain.notification.repository;

import com.backend.domain.notification.entity.ProjectNotification;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ProjectNotificationRepository extends JpaRepository<ProjectNotification, String> {
    List<ProjectNotification> findByRecipient_IdOrderByCreatedAtDesc(String recipientId);
}
