package com.backend.domain.project.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProjectTest {

    @Test
    void cancellationRequiresConfirmationFromTheOtherParticipant() {
        Project project = createWorkingProject();

        project.requestCancel("requester-id");

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.CANCELLATION_PENDING);
        assertThat(project.getCancellationRequestedBy()).isEqualTo("requester-id");

        project.requestCancel("editor-id");

        assertThat(project.getStatus()).isEqualTo(ProjectStatus.CANCELED);
        assertThat(project.getCancellationRequestedBy()).isNull();
    }

    @Test
    void cancellationRequesterCannotConfirmOwnRequest() {
        Project project = createWorkingProject();
        project.requestCancel("requester-id");

        assertThatThrownBy(() -> project.requestCancel("requester-id"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("상대방의 취소 확인을 기다리는 중입니다.");
        assertThat(project.getStatus()).isEqualTo(ProjectStatus.CANCELLATION_PENDING);
    }

    private Project createWorkingProject() {
        Project project = new Project(null, null, null, "영상 편집", 10000, 1,
                ProjectWorkUnit.CASE, 1, false, null, null);
        project.start();
        return project;
    }
}
