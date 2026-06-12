package com.backend.domain.profile.service;

import com.backend.domain.profile.dto.PortfolioResponse;
import com.backend.domain.profile.dto.PublicProfilePostResponse;
import com.backend.domain.profile.dto.PublicProfileResponse;
import com.backend.domain.profile.dto.RecentDealResponse;
import com.backend.domain.profile.dto.ReviewResponse;
import com.backend.domain.mypage.entity.Post;
import com.backend.domain.mypage.entity.PostLike;
import com.backend.domain.mypage.repository.MyPagePostLikeRepository;
import com.backend.domain.mypage.repository.MyPagePostRepository;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.Project;
import com.backend.domain.profile.entity.Review;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.profile.repository.PortfolioRepository;
import com.backend.domain.profile.repository.ProjectRepository;
import com.backend.domain.profile.repository.ReviewRepository;
import com.backend.domain.profile.repository.UserTagRepository;
import com.backend.domain.user.entity.Profile;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.ProfileRepository;
import com.backend.domain.user.repository.UserRepository;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PublicProfileService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;
    private final UserTagRepository userTagRepository;
    private final ReviewRepository reviewRepository;
    private final ProjectRepository projectRepository;
    private final ProfileRepository profileRepository;
    private final MyPagePostRepository postRepository;
    private final MyPagePostLikeRepository postLikeRepository;

    public PublicProfileService(
            UserRepository userRepository,
            PortfolioRepository portfolioRepository,
            UserTagRepository userTagRepository,
            ReviewRepository reviewRepository,
            ProjectRepository projectRepository,
            ProfileRepository profileRepository,
            MyPagePostRepository postRepository,
            MyPagePostLikeRepository postLikeRepository
    ) {
        this.userRepository = userRepository;
        this.portfolioRepository = portfolioRepository;
        this.userTagRepository = userTagRepository;
        this.reviewRepository = reviewRepository;
        this.projectRepository = projectRepository;
        this.profileRepository = profileRepository;
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
    }

    @Transactional(readOnly = true)
    public PublicProfileResponse getPublicProfile(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "존재하지 않는 사용자입니다"));

        Profile profile = profileRepository.findByUser_Id(userId).orElse(null);

        return new PublicProfileResponse(
                user.getId(),
                user.getNickname(),
                user.getProfileImage(),
                user.getRole() == null ? null : user.getRole().name(),
                getTagNames(userId, UserTagType.FIELD),
                getTagNames(userId, UserTagType.TOOL),
                user.getMannerScore(),
                getPortfolios(userId),
                getReviews(userId),
                getRecentDeals(userId),
                profile != null && profile.isPublicPostsVisible(),
                profile != null && profile.isPublicLikedPostsVisible(),
                profile != null && profile.isPublicPostsVisible() ? getPublicPosts(userId) : Collections.emptyList(),
                profile != null && profile.isPublicLikedPostsVisible() ? getPublicLikedPosts(userId) : Collections.emptyList()
        );
    }

    private List<String> getTagNames(String userId, UserTagType tagType) {
        return userTagRepository.findByUser_IdAndTagTypeOrderByTagNameAsc(userId, tagType)
                .stream()
                .map(UserTag::getTagName)
                .toList();
    }

    private List<PortfolioResponse> getPortfolios(String userId) {
        return portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .map(this::toPortfolioResponse)
                .toList();
    }

    private PortfolioResponse toPortfolioResponse(Portfolio portfolio) {
        String thumbnailUrl = portfolio.getThumbnailUrl();
        if (thumbnailUrl == null || thumbnailUrl.isBlank()) {
            thumbnailUrl = portfolio.getImageUrl();
        }
        return new PortfolioResponse(
                portfolio.getId(),
                portfolio.getTitle(),
                thumbnailUrl,
                portfolio.getDisplayOrder()
        );
    }

    private List<ReviewResponse> getReviews(String userId) {
        return reviewRepository.findByTargetUser_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toReviewResponse)
                .toList();
    }

    private ReviewResponse toReviewResponse(Review review) {
        return new ReviewResponse(
                review.getId(),
                review.getReviewer().getNickname(),
                review.getRating().doubleValue(),
                review.getContent(),
                review.getCreatedAt() == null ? "" : review.getCreatedAt().format(DATE_FORMATTER)
        );
    }

    private List<RecentDealResponse> getRecentDeals(String userId) {
        return projectRepository.findTop3ByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(this::toRecentDealResponse)
                .toList();
    }

    private RecentDealResponse toRecentDealResponse(Project project) {
        String title = project.getField();
        if (title == null || title.isBlank()) {
            title = "프로젝트";
        }
        return new RecentDealResponse(
                project.getId(),
                title,
                project.getStatus().name(),
                project.getUpdatedAt() == null ? "" : project.getUpdatedAt().format(DATE_FORMATTER)
        );
    }
    private List<PublicProfilePostResponse> getPublicPosts(String userId) {
        return postRepository.findByAuthor_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toPublicProfilePostResponse)
                .toList();
    }

    private List<PublicProfilePostResponse> getPublicLikedPosts(String userId) {
        return postLikeRepository.findByUser_IdOrderByPost_CreatedAtDesc(userId)
                .stream()
                .map(PostLike::getPost)
                .map(this::toPublicProfilePostResponse)
                .toList();
    }

    private PublicProfilePostResponse toPublicProfilePostResponse(Post post) {
        return new PublicProfilePostResponse(
                post.getId(),
                post.getBoardType().name(),
                post.getPostType() == null ? null : post.getPostType().name(),
                post.getTitle(),
                post.getAuthor().getNickname(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getViewCount(),
                post.getCreatedAt() == null ? "" : post.getCreatedAt().format(DATE_FORMATTER)
        );
    }
}
