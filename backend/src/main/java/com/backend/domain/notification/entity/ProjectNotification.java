package com.backend.domain.notification.entity;

import com.backend.domain.project.entity.Project;
import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "project_notifications")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectNotification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recipient_id", nullable = false)
    private User recipient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "actor_id", nullable = false)
    private User actor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private ProjectNotificationType type;

    @Column(name = "read_at")
    private LocalDateTime readAt;

    public ProjectNotification(User recipient, User actor, Project project, ProjectNotificationType type) {
        this.recipient = recipient;
        this.actor = actor;
        this.project = project;
        this.type = type;
    }

    public void markAsRead() {
        if (readAt == null) readAt = LocalDateTime.now();
    }
}
