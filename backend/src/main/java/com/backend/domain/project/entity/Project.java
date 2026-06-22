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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "proposed_by_id", nullable = false)
    private User proposedBy;

    @Column(nullable = false, length = 50)
    private String field;

    @Column(nullable=false)
    private Integer price;

    @Column(name = "work_amount", nullable = false)
    private Integer workAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_unit", nullable = false, length = 20)
    private ProjectWorkUnit workUnit = ProjectWorkUnit.MINUTE;

    @Column(name = "revision_count", nullable=false)
    private int revisionCount = 0;

    @Column(name = "revision_unlimited", nullable = false)
    private boolean revisionUnlimited = false;

    @Column(nullable=false)
    private LocalDateTime deadline;

    @Column(columnDefinition = "TEXT")
    private String memo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ProjectStatus status = ProjectStatus.WAITING;

    @Column(name = "completion_requested_by", length = 36)
    private String completionRequestedBy;

    @Column(name = "cancellation_requested_by", length = 36)
    private String cancellationRequestedBy;

    @Column(name = "safe_payment_held", nullable = false)
    private boolean safePaymentHeld = false;



    public Project(ChatRoom room, User requester, User editor, User proposedBy, String field, Integer price, Integer workAmount, ProjectWorkUnit workUnit, int revisionCount, boolean revisionUnlimited, LocalDateTime deadline, String memo) {
        this.room = room;
        this.requester = requester;
        this.editor = editor;
        this.proposedBy = proposedBy;
        this.field = field;
        this.price = price;
        this.workAmount = workAmount;
        this.workUnit = workUnit == null ? ProjectWorkUnit.MINUTE : workUnit;
        this.revisionCount = revisionCount;
        this.revisionUnlimited = revisionUnlimited;
        this.deadline = deadline;
        this.memo = memo;
    }

    public Project(ChatRoom room, User requester, User editor, String field, Integer price, Integer workAmount, ProjectWorkUnit workUnit, int revisionCount, boolean revisionUnlimited, LocalDateTime deadline, String memo) {
        this(room, requester, editor, requester, field, price, workAmount, workUnit, revisionCount, revisionUnlimited, deadline, memo);
    }

    public void update(String field, Integer price, Integer workAmount, ProjectWorkUnit workUnit, int revisionCount, boolean revisionUnlimited, LocalDateTime deadline, String memo) {
        this.field = field;
        this.price = price;
        this.workAmount = workAmount;
        this.workUnit = workUnit == null ? ProjectWorkUnit.MINUTE : workUnit;
        this.revisionCount = revisionCount;
        this.revisionUnlimited = revisionUnlimited;
        this.deadline = deadline;
        this.memo = memo;
    }

    public void start() {
        this.status = ProjectStatus.WORKING;
        this.safePaymentHeld = true;
    }

    public void clearSafePaymentHeld() {
        this.safePaymentHeld = false;
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

    public void requestCancel(String userId) {
        if (status == ProjectStatus.WAITING
                || status == ProjectStatus.WORKING
                || status == ProjectStatus.COMPLETION_PENDING) {
            this.status = ProjectStatus.CANCELLATION_PENDING;
            this.cancellationRequestedBy = userId;
            this.completionRequestedBy = null;
            return;
        }
        if (status == ProjectStatus.CANCELLATION_PENDING) {
            if (userId.equals(cancellationRequestedBy)) {
                throw new IllegalStateException("상대방의 취소 확인을 기다리는 중입니다.");
            }
            cancel();
            return;
        }
        throw new IllegalStateException("취소 처리할 수 없는 프로젝트 상태입니다.");
    }

    public void reject() {
        this.status = ProjectStatus.REJECTED;
    }

    public void cancel() {
        this.status = ProjectStatus.CANCELED;
        this.completionRequestedBy = null;
        this.cancellationRequestedBy = null;
    }
}
