package com.backend.domain.project.entity;

import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@Entity
@Table(name = "projects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private ChatRoom room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "editor_id", nullable = false)
    private User editor;

    @Column(length = 50)
    private String field;

    @Column
    private Integer price;

    @Column(name = "video_length")
    private Integer videoLength;

    @Column(name = "revision_count", nullable=false)
    private int revisionCount = 0;

    @Column
    private LocalDateTime deadline;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectStatus status = ProjectStatus.WAITING;

    @Column(name = "completion_requested_by", length = 36)
    private String completionRequestedBy;



    public Project(ChatRoom room, User requester, User editor, String field, Integer price, Integer videoLength, LocalDateTime deadline, String memo) {
        this.room = room;
        this.requester = requester;
        this.editor = editor;
        this.field = field;
        this.price = price;
        this.videoLength = videoLength;
        this.deadline = deadline;
        this.memo = memo;
    }

    public void update(String field, Integer price, Integer videoLength, LocalDateTime deadline, String memo) {
        this.field = field;
        this.price = price;
        this.videoLength = videoLength;
        this.deadline = deadline;
        this.memo = memo;
    }

    public void start() {
        this.status = ProjectStatus.WORKING;
    }

    public void requestComplete(String userId) {
        if (status == ProjectStatus.WORKING) {
            this.status = ProjectStatus.COMPLETION_PENDING;
            this.completionRequestedBy = userId;
            return;
        }
        if (status == ProjectStatus.COMPLETION_PENDING) {
            if (userId.equals(completionRequestedBy)) {
                throw new IllegalStateException("상대방의 완료 확인을 기다리는 중입니다.");
            }
            this.status = ProjectStatus.COMPLETED;
            this.completionRequestedBy = null;
            return;
        }
        throw new IllegalStateException("완료 처리할 수 없는 프로젝트 상태입니다.");
    }

    // 분쟁 조정 양측 동의 시 프로젝트 완료 처리
    public void completeByDispute() {
        this.status = ProjectStatus.COMPLETED;
    }

    public void reject() {
        this.status = ProjectStatus.REJECTED;
    }

    public void cancel() {
        this.status = ProjectStatus.CANCELED;
        this.completionRequestedBy = null;
    }
}
