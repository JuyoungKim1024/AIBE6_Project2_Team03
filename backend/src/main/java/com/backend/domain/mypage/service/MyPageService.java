package com.backend.domain.mypage.service;

import com.backend.domain.mypage.dto.MyChatRoomResponse;
import com.backend.domain.mypage.dto.MyLikedPostResponse;
import com.backend.domain.mypage.dto.MyMatchRequestResponse;
import com.backend.domain.mypage.dto.MyPostResponse;
import com.backend.domain.mypage.dto.MyProjectResponse;
import com.backend.domain.mypage.dto.MyProjectsResponse;
import com.backend.domain.mypage.dto.MatchingPriceRequest;
import com.backend.domain.mypage.dto.MatchingPriceResponse;
import com.backend.domain.mypage.dto.PublicContentVisibilityRequest;
import com.backend.domain.mypage.dto.PublicContentVisibilityResponse;
import com.backend.domain.mypage.entity.ChatRoomUser;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.entity.Message;
import com.backend.domain.mypage.entity.Post;
import com.backend.domain.mypage.entity.PostLike;
import com.backend.domain.mypage.repository.MyPageChatRoomUserRepository;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.mypage.repository.MyPageMessageRepository;
import com.backend.domain.mypage.repository.MyPagePostLikeRepository;
import com.backend.domain.mypage.repository.MyPagePostRepository;
import com.backend.domain.mypage.repository.MyPageProjectRepository;
import com.backend.domain.profile.entity.Project;
import com.backend.domain.user.entity.Profile;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.ProfileRepository;
import com.backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class MyPageService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final MyPagePostRepository postRepository;
    private final MyPagePostLikeRepository postLikeRepository;
    private final MyPageChatRoomUserRepository chatRoomUserRepository;
    private final MyPageMessageRepository messageRepository;
    private final MyPageMatchRequestRepository matchRequestRepository;
    private final MyPageProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;

    public MyPageService(
            MyPagePostRepository postRepository,
            MyPagePostLikeRepository postLikeRepository,
            MyPageChatRoomUserRepository chatRoomUserRepository,
            MyPageMessageRepository messageRepository,
            MyPageMatchRequestRepository matchRequestRepository,
            MyPageProjectRepository projectRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository
    ) {
        this.postRepository = postRepository;
        this.postLikeRepository = postLikeRepository;
        this.chatRoomUserRepository = chatRoomUserRepository;
        this.messageRepository = messageRepository;
        this.matchRequestRepository = matchRequestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
    }

    public List<MyPostResponse> getMyPosts(String userId) {
        return postRepository.findByAuthor_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toMyPostResponse)
                .toList();
    }

    @Transactional
    public void deleteMyPost(String userId, String postId) {
        postRepository.findByIdAndAuthor_Id(postId, userId)
                .ifPresent(postRepository::delete);
    }

    public List<MyLikedPostResponse> getLikedPosts(String userId) {
        return postLikeRepository.findByUser_IdOrderByPost_CreatedAtDesc(userId)
                .stream()
                .map(PostLike::getPost)
                .map(this::toLikedPostResponse)
                .toList();
    }

    @Transactional
    public void unlikePost(String userId, String postId) {
        postLikeRepository.findByUser_IdAndPost_Id(userId, postId)
                .ifPresent(postLikeRepository::delete);
    }

    public List<MyChatRoomResponse> getChatRooms(String userId) {
        return chatRoomUserRepository.findByUser_IdOrderByJoinedAtDesc(userId)
                .stream()
                .map(roomUser -> toChatRoomResponse(userId, roomUser))
                .toList();
    }

    public MyProjectsResponse getProjects(String userId) {
        List<MyMatchRequestResponse> received = matchRequestRepository
                .findByEditor_IdAndStatusOrderByCreatedAtDesc(userId, MatchRequestStatus.WAITING)
                .stream()
                .map(this::toMatchRequestResponse)
                .toList();

        List<MyProjectResponse> ongoing = projectRepository
                .findByRequester_IdOrEditor_IdOrderByUpdatedAtDesc(userId, userId)
                .stream()
                .map(project -> toProjectResponse(userId, project))
                .toList();

        return new MyProjectsResponse(received, ongoing);
    }

    public MatchingPriceResponse getMatchingPrice(String userId) {
        User user = getUser(userId);
        return new MatchingPriceResponse(
                user.isMatchEnabled(),
                user.getMatchPrice(),
                user.getMatchPriceUnit(),
                hasRepresentativePortfolio(userId)
        );
    }

    @Transactional
    public MatchingPriceResponse updateMatchingPrice(String userId, MatchingPriceRequest request) {
        User user = getUser(userId);

        if (request.matchEnabled()) {
            if (request.matchPrice() == null || request.matchPrice() <= 0) {
                throw new IllegalArgumentException("단가를 먼저 설정해주세요");
            }
            if (!request.representativePortfolioConfigured() && !hasRepresentativePortfolio(userId)) {
                throw new IllegalArgumentException("대표 포트폴리오를 먼저 설정해주세요");
            }
        }

        user.updateMatchingPrice(request.matchEnabled(), request.matchPrice(), request.matchPriceUnit());
        return getMatchingPrice(userId);
    }

    public PublicContentVisibilityResponse getPublicContentVisibility(String userId) {
        return profileRepository.findByUser_Id(userId)
                .map(profile -> new PublicContentVisibilityResponse(
                        profile.isPublicPostsVisible(),
                        profile.isPublicLikedPostsVisible()
                ))
                .orElseGet(() -> new PublicContentVisibilityResponse(false, false));
    }

    @Transactional
    public PublicContentVisibilityResponse updatePublicContentVisibility(String userId, PublicContentVisibilityRequest request) {
        User user = getUser(userId);
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> profileRepository.save(new Profile(user, null, null)));
        boolean publicPostsVisible = request.publicPostsVisible() == null
                ? profile.isPublicPostsVisible()
                : request.publicPostsVisible();
        boolean publicLikedPostsVisible = request.publicLikedPostsVisible() == null
                ? profile.isPublicLikedPostsVisible()
                : request.publicLikedPostsVisible();
        profile.updatePublicContentVisibility(publicPostsVisible, publicLikedPostsVisible);
        return new PublicContentVisibilityResponse(
                profile.isPublicPostsVisible(),
                profile.isPublicLikedPostsVisible()
        );
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private boolean hasRepresentativePortfolio(String userId) {
        return profileRepository.findByUser_Id(userId)
                .map(profile -> profile.getRepresentativePortfolioId() != null && !profile.getRepresentativePortfolioId().isBlank())
                .orElse(false);
    }

    private MyPostResponse toMyPostResponse(Post post) {
        return new MyPostResponse(
                post.getId(),
                post.getBoardType().name(),
                post.getPostType() == null ? null : post.getPostType().name(),
                post.getTitle(),
                formatDate(post.getCreatedAt()),
                post.getViewCount(),
                post.getChatCount()
        );
    }

    private MyLikedPostResponse toLikedPostResponse(Post post) {
        return new MyLikedPostResponse(
                post.getId(),
                post.getBoardType().name(),
                post.getPostType() == null ? null : post.getPostType().name(),
                post.getTitle(),
                post.getAuthor().getNickname(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getViewCount(),
                formatDate(post.getCreatedAt())
        );
    }

    private MyChatRoomResponse toChatRoomResponse(String userId, ChatRoomUser roomUser) {
        String roomId = roomUser.getRoom().getId();
        String partnerName = chatRoomUserRepository.findByRoom_Id(roomId)
                .stream()
                .map(ChatRoomUser::getUser)
                .filter(user -> !user.getId().equals(userId))
                .map(User::getNickname)
                .findFirst()
                .orElse("알 수 없음");

        Message lastMessage = messageRepository.findTopByRoom_IdOrderByCreatedAtDesc(roomId)
                .orElse(null);

        return new MyChatRoomResponse(
                roomId,
                partnerName,
                lastMessage == null || lastMessage.getContent() == null ? "" : lastMessage.getContent(),
                formatDate(lastMessage == null ? roomUser.getJoinedAt() : lastMessage.getCreatedAt()),
                roomUser.getUnreadCount()
        );
    }

    private MyMatchRequestResponse toMatchRequestResponse(MatchRequest request) {
        return new MyMatchRequestResponse(
                request.getId(),
                request.getRequester().getNickname(),
                request.getStatus().name(),
                formatDate(request.getCreatedAt())
        );
    }

    private MyProjectResponse toProjectResponse(String userId, Project project) {
        User partner = project.getRequester().getId().equals(userId) ? project.getEditor() : project.getRequester();
        return new MyProjectResponse(
                project.getId(),
                partner.getNickname(),
                project.getField(),
                project.getStatus().name(),
                formatDate(project.getUpdatedAt())
        );
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(DATE_FORMATTER);
    }
}
