package com.backend.domain.support.entity;

import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "support_tickets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SupportTicket extends BaseEntity {

    public enum Type { INQUIRY, REPORT }
    public enum Status { RECEIVED, IN_PROGRESS, COMPLETED, REJECTED }

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_type", nullable = false, length = 20)
    private Type type;

    @Column(nullable = false, length = 50)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "target_url", length = 500)
    private String targetUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.RECEIVED;

    @Column(name = "admin_note", columnDefinition = "TEXT")
    private String adminNote;

    public SupportTicket(User user, Type type, String category, String title, String content, String targetUrl) {
        this.user = user;
        this.type = type;
        this.category = category;
        this.title = title;
        this.content = content;
        this.targetUrl = targetUrl;
    }

    public void updateStatus(Status status, String adminNote) {
        this.status = status;
        this.adminNote = adminNote;
    }
}
