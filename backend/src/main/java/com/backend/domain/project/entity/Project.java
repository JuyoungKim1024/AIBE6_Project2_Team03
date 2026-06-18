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

    public void start() {
        this.status = ProjectStatus.WORKING;
    }

    public void complete() {
        this.status = ProjectStatus.COMPLETED;
    }

    public void reject() {
        this.status = ProjectStatus.REJECTED;
    }

    public void cancel() {
        this.status = ProjectStatus.CANCELED;
    }
}
