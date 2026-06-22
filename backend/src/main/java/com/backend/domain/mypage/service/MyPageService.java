package com.backend.domain.mypage.service;

import com.backend.domain.chat.dto.ChatPostSummaryDTO;
import com.backend.domain.chat.dto.MyChatRoomResponseDTO;
import com.backend.domain.chat.entity.ChatMessage;
import com.backend.domain.chat.entity.ChatParticipant;
import com.backend.domain.chat.entity.ChatRoom;
import com.backend.domain.chat.repository.ChatMessageRepository;
import com.backend.domain.chat.repository.ChatParticipantRepository;
import com.backend.domain.mypage.dto.*;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.mypage.repository.MyPageProjectRepository;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.Post;
import com.backend.domain.post.entity.PostTag;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.project.entity.Project;
import com.backend.domain.profile.entity.PortfolioGroup;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.profile.repository.PortfolioGroupRepository;
import com.backend.domain.profile.repository.PortfolioRepository;
import com.backend.domain.profile.repository.ReviewRepository;
import com.backend.domain.profile.repository.UserTagRepository;
import com.backend.domain.user.entity.Profile;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.ProfileRepository;
import com.backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class MyPageService {

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    private final ChatParticipantRepository chatParticipantRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MyPageMatchRequestRepository matchRequestRepository;
    private final MyPageProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserTagRepository userTagRepository;
    private final PortfolioRepository portfolioRepository;
    private final PortfolioGroupRepository portfolioGroupRepository;
    private final PostRepository postRepository;
    private final ReviewRepository reviewRepository;

    public MyPageService(
            ChatParticipantRepository chatParticipantRepository,
            ChatMessageRepository chatMessageRepository,
            MyPageMatchRequestRepository matchRequestRepository,
            MyPageProjectRepository projectRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            UserTagRepository userTagRepository,
            PortfolioRepository portfolioRepository,
            PortfolioGroupRepository portfolioGroupRepository,
            PostRepository postRepository,
            ReviewRepository reviewRepository
    ) {
        this.chatParticipantRepository = chatParticipantRepository;
        this.chatMessageRepository = chatMessageRepository;
        this.matchRequestRepository = matchRequestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userTagRepository = userTagRepository;
        this.portfolioRepository = portfolioRepository;
        this.portfolioGroupRepository = portfolioGroupRepository;
        this.postRepository = postRepository;
        this.reviewRepository = reviewRepository;
    }

    public List<MyChatRoomResponseDTO> getChatRooms(String userId) {
        return chatParticipantRepository.findByUser_IdAndDeletedAtIsNull(userId)
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
                .findVisibleProjectsByUserId(userId)
                .stream()
                .map(project -> toProjectResponse(userId, project))
                .toList();

        return new MyProjectsResponse(received, ongoing);
    }

    public MatchingPriceResponse getMatchingPrice(String userId) {
        User user = getUser(userId);
        return new MatchingPriceResponse(
                user.isMatchEnabled(),
                user.getMatchPriceMin(),
                user.getMatchPriceMax(),
                user.getMatchPriceUnit(),
                hasRepresentativePortfolio(userId)
        );
    }

    @Transactional
    public MatchingPriceResponse updateMatchingPrice(String userId, MatchingPriceRequest request) {
        User user = getUser(userId);

        if (request.matchEnabled()) {
            if (request.matchPriceMin() == null || request.matchPriceMin() <= 0) {
                throw new IllegalArgumentException("최소 단가를 설정해주세요");
            }
            if (request.matchPriceMax() == null || request.matchPriceMax() <= 0) {
                throw new IllegalArgumentException("최대 단가를 설정해주세요");
            }
            if (request.matchPriceMin() > request.matchPriceMax()) {
                throw new IllegalArgumentException("최소 단가는 최대 단가보다 클 수 없습니다");
            }
            if (!request.representativePortfolioConfigured() && !hasRepresentativePortfolio(userId)) {
                throw new IllegalArgumentException("대표 포트폴리오를 먼저 설정해주세요");
            }
        }

        user.updateMatchingPrice(request.matchEnabled(), request.matchPriceMin(), request.matchPriceMax(), request.matchPriceUnit());
        return getMatchingPrice(userId);
    }

    public PublicContentVisibilityResponse getPublicContentVisibility(String userId) {
        return profileRepository.findByUser_Id(userId)
                .map(profile -> new PublicContentVisibilityResponse(
                        profile.isPublicPostsVisible(),
                        profile.isPublicJobPostsVisible(),
                        profile.isPublicCommunityPostsVisible(),
                        profile.isPublicLikedPostsVisible()
                ))
                .orElseGet(() -> new PublicContentVisibilityResponse(false, false, false, false));
    }

    @Transactional
    public PublicContentVisibilityResponse updatePublicContentVisibility(String userId, PublicContentVisibilityRequest request) {
        User user = getUser(userId);
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> profileRepository.save(new Profile(user, null, null)));
        boolean publicPostsVisible = request.publicPostsVisible() == null
                ? profile.isPublicPostsVisible()
                : request.publicPostsVisible();
        boolean publicJobPostsVisible = request.publicJobPostsVisible() == null
                ? profile.isPublicJobPostsVisible()
                : request.publicJobPostsVisible();
        boolean publicCommunityPostsVisible = request.publicCommunityPostsVisible() == null
                ? profile.isPublicCommunityPostsVisible()
                : request.publicCommunityPostsVisible();
        boolean publicLikedPostsVisible = request.publicLikedPostsVisible() == null
                ? profile.isPublicLikedPostsVisible()
                : request.publicLikedPostsVisible();
        profile.updatePublicContentVisibility(
                publicPostsVisible || publicJobPostsVisible || publicCommunityPostsVisible,
                publicJobPostsVisible,
                publicCommunityPostsVisible,
                publicLikedPostsVisible
        );
        return new PublicContentVisibilityResponse(
                profile.isPublicPostsVisible(),
                profile.isPublicJobPostsVisible(),
                profile.isPublicCommunityPostsVisible(),
                profile.isPublicLikedPostsVisible()
        );
    }

    public List<MyPostResponse> getPosts(String userId) {
        return postRepository.findByAuthor_IdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toMyPostResponse)
                .toList();
    }

    @Transactional
    public MyPostResponse updatePostVisibility(String userId, String postId, PostVisibilityRequest request) {
        Post post = getOwnedPost(userId, postId);
        post.updatePublicVisible(Boolean.TRUE.equals(request.publicVisible()));
        return toMyPostResponse(post);
    }

    @Transactional
    public void deletePost(String userId, String postId) {
        postRepository.delete(getOwnedPost(userId, postId));
    }

    public List<PortfolioItemResponse> getPortfolios(String userId) {
        return portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .map(PortfolioItemResponse::from)
                .toList();
    }

    public List<PortfolioGroupResponse> getPortfolioGroups(String userId) {
        return portfolioGroupRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .map(PortfolioGroupResponse::from)
                .toList();
    }

    @Transactional
    public PortfolioGroupResponse createPortfolioGroup(String userId, PortfolioGroupCreateRequest request) {
        String name = request.name() == null ? "" : request.name().trim();
        if (name.isBlank()) {
            throw new IllegalArgumentException("그룹 이름을 입력해주세요.");
        }

        List<PortfolioGroup> groups = portfolioGroupRepository.findByUser_IdOrderByDisplayOrderAsc(userId);
        int nextDisplayOrder = groups.stream()
                .mapToInt(PortfolioGroup::getDisplayOrder)
                .max()
                .orElse(0) + 1;
        PortfolioGroup group = new PortfolioGroup(
                getUser(userId),
                name,
                nextDisplayOrder,
                groups.isEmpty()
        );
        return PortfolioGroupResponse.from(portfolioGroupRepository.save(group));
    }

    @Transactional
    public List<PortfolioGroupResponse> savePortfolioGroups(String userId, List<PortfolioGroupRequest> requests) {
        User user = getUser(userId);
        if (!requests.isEmpty() && requests.stream().filter(PortfolioGroupRequest::representative).count() != 1) {
            throw new IllegalArgumentException("대표 그룹을 하나 선택해주세요.");
        }

        java.util.Map<String, PortfolioGroup> existingById = portfolioGroupRepository
                .findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .collect(java.util.stream.Collectors.toMap(PortfolioGroup::getId, group -> group));
        List<PortfolioGroup> savedGroups = new java.util.ArrayList<>();

        for (PortfolioGroupRequest request : requests) {
            String name = request.name() == null ? "" : request.name().trim();
            if (name.isBlank()) {
                throw new IllegalArgumentException("그룹 이름을 입력해주세요.");
            }
            PortfolioGroup group = request.id() == null ? null : existingById.remove(request.id());
            if (group == null) {
                group = new PortfolioGroup(user, name, request.displayOrder(), request.representative());
            } else {
                group.update(name, request.displayOrder(), request.representative());
            }
            savedGroups.add(portfolioGroupRepository.save(group));
        }

        existingById.values().forEach(portfolioGroupRepository::delete);
        portfolioGroupRepository.flush();
        applyRepresentativeGroup(userId);
        return savedGroups.stream()
                .sorted(java.util.Comparator.comparingInt(PortfolioGroup::getDisplayOrder))
                .map(PortfolioGroupResponse::from)
                .toList();
    }

    @Transactional
    public void savePortfolios(String userId, List<PortfolioItemRequest> items) {
        User user = getUser(userId);
        portfolioRepository.deleteByUser_Id(userId);
        portfolioRepository.flush();

        PortfolioGroup representativeGroup = portfolioGroupRepository
                .findByUser_IdAndRepresentativeTrue(userId)
                .orElse(null);
        List<Portfolio> portfolios = new java.util.ArrayList<>();
        for (PortfolioItemRequest item : items) {
            PortfolioGroup group = item.groupId() == null ? null : portfolioGroupRepository
                    .findByIdAndUser_Id(item.groupId(), userId)
                    .orElseThrow(() -> new IllegalArgumentException("포트폴리오 그룹을 찾을 수 없습니다."));
            String thumbnailUrl = "video".equals(item.type()) ? item.url() : null;
            String imageUrl = "image".equals(item.type()) ? item.url() : null;
            boolean representative = representativeGroup == null
                    ? item.representative()
                    : group != null
                    && group.getId().equals(representativeGroup.getId())
                    && item.displayOrder() == 1;
            portfolios.add(new Portfolio(
                    user,
                    group,
                    item.title(),
                    thumbnailUrl,
                    imageUrl,
                    item.displayOrder(),
                    representative
            ));
        }
        portfolioRepository.saveAll(portfolios);
    }

    public TagsResponse getTags(String userId) {
        List<UserTag> tags = userTagRepository.findByUser_IdOrderByTagNameAsc(userId);
        List<String> fields = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.FIELD)
                .map(UserTag::getTagName).toList();
        List<String> tools = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.TOOL)
                .map(UserTag::getTagName).toList();
        List<String> contentTypes = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.CONTENT_TYPE)
                .map(UserTag::getTagName).toList();
        return new TagsResponse(fields, tools, contentTypes);
    }

    @Transactional
    public void updateTags(String userId, UpdateTagsRequest request) {
        User user = getUser(userId);
        userTagRepository.deleteByUser_Id(userId);
        userTagRepository.flush();

        List<UserTag> newTags = new java.util.ArrayList<>();
        if (request.fields() != null) {
            request.fields().forEach(name -> newTags.add(new UserTag(user, UserTagType.FIELD, name)));
        }
        if (request.tools() != null) {
            request.tools().forEach(name -> newTags.add(new UserTag(user, UserTagType.TOOL, name)));
        }
        if (request.contentTypes() != null) {
            request.contentTypes().forEach(name -> newTags.add(new UserTag(user, UserTagType.CONTENT_TYPE, name)));
        }
        userTagRepository.saveAll(newTags);
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private Post getOwnedPost(String userId, String postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        if (!post.getAuthor().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 글만 수정할 수 있습니다.");
        }
        return post;
    }

    private MyPostResponse toMyPostResponse(Post post) {
        String boardType = post instanceof CommunityPost ? "COMMUNITY" : "JOB";
        String postType = post instanceof JobPost jobPost && jobPost.getPostType() != null
                ? jobPost.getPostType().name()
                : null;
        return new MyPostResponse(
                post.getId(),
                boardType,
                postType,
                post.getTitle(),
                post.getAuthor().getNickname(),
                formatDate(post.getCreatedAt()),
                post.getViewCount(),
                post.getCommentCount(),
                post.getLikeCount(),
                post.isPublicVisible()
        );
    }

    private boolean hasRepresentativePortfolio(String userId) {
        return portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .anyMatch(Portfolio::isRepresentative);
    }

    private void applyRepresentativeGroup(String userId) {
        PortfolioGroup representativeGroup = portfolioGroupRepository
                .findByUser_IdAndRepresentativeTrue(userId)
                .orElse(null);
        List<Portfolio> portfolios = portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId);
        for (Portfolio portfolio : portfolios) {
            boolean representative = representativeGroup != null
                    && portfolio.getGroup() != null
                    && portfolio.getGroup().getId().equals(representativeGroup.getId())
                    && portfolio.getDisplayOrder() == 1;
            portfolio.updateRepresentative(representative);
        }
    }

    private MyChatRoomResponseDTO toChatRoomResponse(String userId, ChatParticipant roomUser) {
        ChatRoom room = roomUser.getChatRoom();
        String roomId = room.getId();

        User partner = chatParticipantRepository.findByChatRoom_Id(roomId)
                .stream()
                .map(ChatParticipant::getUser)
                .filter(user -> !user.getId().equals(userId))
                .findFirst()
                .orElse(null);
        String partnerId = partner == null ? null : partner.getId();
        String partnerName = partner == null ? "알 수 없음" : partner.getNickname();
        boolean partnerDeleted = partner != null && partner.isDeleted();

        ChatMessage lastMessage = chatMessageRepository.findTopByChatRoom_IdOrderByCreatedAtDesc(roomId);

        ChatPostSummaryDTO postSummary = null;



        if(room.getPost() != null) {
            Post post = room.getPost();

            Integer priceMin = null;
            Integer priceMax = null;

            if(post instanceof JobPost jobPost && jobPost.isPriceVisible()) {
                priceMin = jobPost.getMinPrice();
                priceMax = jobPost.getMaxPrice();
            }

            postSummary = new ChatPostSummaryDTO(
                    post.getId(),
                    post.getTitle(),
                    priceMin,
                    priceMax,
                    post.getTags().stream()
                            .filter(tag -> tag.getTagType() == PostTag.TagType.FIELD)
                            .map(PostTag::getTagName)
                            .toList(),
                    post.getRevisionCount()
            );
        }

        return new MyChatRoomResponseDTO(
                roomId,
                partnerId,
                partnerName,
                partner == null ? null : partner.getRole(),
                lastMessage == null || lastMessage.getContent() == null ? "" : lastMessage.getContent(),
                formatDate(lastMessage == null ? roomUser.getJoinedAt() : lastMessage.getCreatedAt()),
                room.getChatRoomType(),
                roomUser.getUnreadCount(),
                postSummary,
                partnerDeleted
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
                project.getRoom().getId(),
                project.getRequester().getId(),
                project.getProposedBy().getId(),
                partner.getNickname(),
                project.getField(),
                project.getStatus().name(),
                project.getCompletionRequestedBy(),
                project.getCancellationRequestedBy(),
                reviewRepository.existsByProject_Id(project.getId()),
                formatDate(project.getUpdatedAt())
        );
    }

    private String formatDate(LocalDateTime dateTime) {
        return dateTime == null ? "" : dateTime.format(DATE_FORMATTER);
    }
}
