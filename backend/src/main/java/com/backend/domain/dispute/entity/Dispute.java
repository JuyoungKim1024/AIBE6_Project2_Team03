package com.backend.domain.dispute.entity;

import com.backend.domain.project.entity.Project;
import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "disputes")
@NoArgsConstructor
public class Dispute extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by", nullable = false)
    private User reportedBy;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DisputeType type;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DisputeStatus status = DisputeStatus.AI_PENDING;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "ai_judgment", columnDefinition = "TEXT")
    private String aiJudgment;

    @Column(name = "final_amount")
    private Integer finalAmount;

    // null=미응답, true=수락, false=불복
    @Column(name = "requester_accepted")
    private Boolean requesterAccepted;

    @Column(name = "editor_accepted")
    private Boolean editorAccepted;

    public Dispute(Project project, User reportedBy, DisputeType type, String description) {
        this.project = project;
        this.reportedBy = reportedBy;
        this.type = type;
        this.description = description;
    }

    public void applyJudgment(String aiJudgment, Integer finalAmount) {
        this.aiJudgment = aiJudgment;
        this.finalAmount = finalAmount;
        this.status = DisputeStatus.AI_JUDGED;
    }

    public void markFailed() {
        this.aiJudgment = null;
        this.status = DisputeStatus.ESCALATED;
    }

    public void respond(String userId, Boolean accepted) {
        String requesterId = project.getRequester().getId();
        String editorId = project.getEditor().getId();

        if (userId.equals(requesterId)) {
            if (this.requesterAccepted != null) throw new IllegalStateException("이미 응답하셨습니다.");
            this.requesterAccepted = accepted;
        } else if (userId.equals(editorId)) {
            if (this.editorAccepted != null) throw new IllegalStateException("이미 응답하셨습니다.");
            this.editorAccepted = accepted;
        } else {
            throw new IllegalArgumentException("프로젝트 참여자만 응답할 수 있습니다.");
        }

        if (Boolean.FALSE.equals(this.requesterAccepted) || Boolean.FALSE.equals(this.editorAccepted)) {
            this.status = DisputeStatus.ESCALATED;
        } else if (Boolean.TRUE.equals(this.requesterAccepted) && Boolean.TRUE.equals(this.editorAccepted)) {
            this.status = DisputeStatus.ACCEPTED;
        }
    }
}
