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

    @Version
    private Long version;  // 동시 응답 방지 (낙관적 잠금)

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

    // null=미응답, true=수락
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

    public void markAiFailed() {
        this.status = DisputeStatus.AI_FAILED;
    }

    public void accept(String userId) {
        if (this.status != DisputeStatus.AI_JUDGED) {
            throw new IllegalStateException("AI 판정이 완료된 분쟁에만 응답할 수 있습니다.");
        }
        if (this.finalAmount == null) {
            throw new IllegalStateException("AI 판정 금액이 설정되지 않아 응답할 수 없습니다.");
        }

        String requesterId = project.getRequester().getId();
        String editorId = project.getEditor().getId();

        if (userId.equals(requesterId)) {
            if (Boolean.TRUE.equals(this.requesterAccepted)) throw new IllegalStateException("이미 동의하셨습니다.");
            this.requesterAccepted = true;
        } else if (userId.equals(editorId)) {
            if (Boolean.TRUE.equals(this.editorAccepted)) throw new IllegalStateException("이미 동의하셨습니다.");
            this.editorAccepted = true;
        } else {
            throw new IllegalArgumentException("프로젝트 참여자만 응답할 수 있습니다.");
        }

        if (Boolean.TRUE.equals(this.requesterAccepted) && Boolean.TRUE.equals(this.editorAccepted)) {
            this.status = DisputeStatus.ACCEPTED;
        }
        // 한쪽만 동의 → AI_JUDGED 유지, 채팅에서 재협의
    }

    public void reject(String userId) {
        if (this.status != DisputeStatus.AI_JUDGED) {
            throw new IllegalStateException("AI 판정이 완료된 분쟁에만 거절할 수 있습니다.");
        }
        String requesterId = project.getRequester().getId();
        String editorId = project.getEditor().getId();
        if (!userId.equals(requesterId) && !userId.equals(editorId)) {
            throw new IllegalArgumentException("프로젝트 참여자만 응답할 수 있습니다.");
        }
        this.status = DisputeStatus.REJECTED;
    }
}
