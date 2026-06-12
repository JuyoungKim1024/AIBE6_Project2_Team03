package com.backend.domain.editor.service;

import com.backend.domain.editor.dto.FeaturedEditorResponse;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.ProjectStatus;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.profile.repository.PortfolioRepository;
import com.backend.domain.profile.repository.ProjectRepository;
import com.backend.domain.profile.repository.ReviewRepository;
import com.backend.domain.profile.repository.UserTagRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FeaturedEditorService {

    private static final double MIN_RATING = 4.0;
    private static final long MIN_COMPLETED_PROJECTS = 1;
    private static final int MONTHS_SINCE_JOIN = 3;

    private final UserRepository userRepository;
    private final ReviewRepository reviewRepository;
    private final ProjectRepository projectRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserTagRepository userTagRepository;

    public List<FeaturedEditorResponse> getFeaturedEditors() {
        LocalDateTime since = LocalDateTime.now().minusMonths(MONTHS_SINCE_JOIN);
        List<User> candidates = userRepository.findEligibleEditors(since);

        return candidates.stream()
                .filter(user -> {
                    long completed = projectRepository.countByEditor_IdAndStatus(user.getId(), ProjectStatus.COMPLETED);
                    if (completed < MIN_COMPLETED_PROJECTS) return false;
                    double rating = reviewRepository.avgRatingByUserId(user.getId());
                    return rating >= MIN_RATING;
                })
                .sorted((a, b) -> {
                    double ratingA = reviewRepository.avgRatingByUserId(a.getId());
                    double ratingB = reviewRepository.avgRatingByUserId(b.getId());
                    return Double.compare(ratingB, ratingA);
                })
                .map(user -> {
                    double rating = reviewRepository.avgRatingByUserId(user.getId());
                    List<UserTag> tags = userTagRepository.findByUser_IdAndTagTypeOrderByTagNameAsc(user.getId(), UserTagType.FIELD);
                    Portfolio portfolio = portfolioRepository.findByUser_IdAndRepresentativeTrue(user.getId()).orElse(null);
                    return FeaturedEditorResponse.of(user, tags, rating, portfolio);
                })
                .toList();
    }
}
