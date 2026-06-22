package com.backend.domain.profile.service;

import com.backend.domain.profile.dto.ReviewCreateRequest;
import com.backend.domain.profile.dto.ReviewResponse;
import com.backend.domain.profile.entity.Review;
import com.backend.domain.profile.repository.ReviewRepository;
import com.backend.domain.project.entity.Project;
import com.backend.domain.project.entity.ProjectStatus;
import com.backend.domain.project.repository.ProjectRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;
import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ReviewRepository reviewRepository;
    private final ProjectRepository projectRepository;

    @Transactional
    public ReviewResponse createReview(String userId, ReviewCreateRequest request) {
        if (request.projectId() == null || request.projectId().isBlank()) {
            throw new IllegalArgumentException("프로젝트 정보가 필요합니다.");
        }
        if (request.rating() < 0.5 || request.rating() > 5 || request.rating() * 2 != Math.rint(request.rating() * 2)) {
            throw new IllegalArgumentException("별점은 0.5점 단위로 선택해주세요.");
        }

        Project project = projectRepository.findByIdWithParticipants(request.projectId())
                .orElseThrow(() -> new IllegalArgumentException("프로젝트를 찾을 수 없습니다."));
        if (project.getStatus() != ProjectStatus.COMPLETED) {
            throw new IllegalArgumentException("완료된 프로젝트만 리뷰를 작성할 수 있습니다.");
        }
        if (reviewRepository.existsByProject_Id(project.getId())) {
            throw new IllegalArgumentException("이미 리뷰를 작성한 프로젝트입니다.");
        }

        User reviewer = project.getRequester().getRole() == UserRole.YOUTUBER
                ? project.getRequester()
                : project.getEditor();
        if (!reviewer.getId().equals(userId) || reviewer.getRole() != UserRole.YOUTUBER) {
            throw new IllegalArgumentException("크리에이터 계정만 리뷰를 작성할 수 있습니다.");
        }
        User targetUser = project.getRequester().getRole() == UserRole.EDITOR
                ? project.getRequester()
                : project.getEditor();
        if (targetUser.getRole() != UserRole.EDITOR) {
            throw new IllegalArgumentException("에디터에게만 리뷰를 작성할 수 있습니다.");
        }
        String content = request.content() == null ? null : request.content().trim();
        if (content != null && content.length() > 1000) {
            throw new IllegalArgumentException("리뷰 내용은 1000자 이하로 입력해주세요.");
        }

        Review review = reviewRepository.save(new Review(
                project,
                reviewer,
                targetUser,
                BigDecimal.valueOf(request.rating()),
                content == null || content.isBlank() ? null : content
        ));
        return new ReviewResponse(
                review.getId(),
                reviewer.getNickname(),
                review.getRating().doubleValue(),
                review.getContent(),
                review.getCreatedAt() == null ? "" : review.getCreatedAt().format(DATE_FORMATTER)
        );
    }
}
