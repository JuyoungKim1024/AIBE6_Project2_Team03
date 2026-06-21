package com.backend.domain.mypage.entity;

import com.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import jakarta.persistence.PrePersist;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "match_requests")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MatchRequest {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "editor_id", nullable = false)
    private User editor;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private MatchRequestStatus status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "notification_dismissed_at")
    private LocalDateTime notificationDismissedAt;

    public MatchRequest(User requester, User editor) {
        this.requester = requester;
        this.editor = editor;
        this.status = MatchRequestStatus.WAITING;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public void accept() {
        if (this.status != MatchRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
        this.status = MatchRequestStatus.ACCEPTED;
    }

    public void reject() {
        if (this.status != MatchRequestStatus.WAITING) {
            throw new IllegalStateException("이미 처리된 요청입니다.");
        }
        this.status = MatchRequestStatus.REJECTED;
    }

    public void dismissNotification() {
        this.notificationDismissedAt = LocalDateTime.now();
    }
}
