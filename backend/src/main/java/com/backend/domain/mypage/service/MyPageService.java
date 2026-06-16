package com.backend.domain.mypage.service;

import com.backend.domain.mypage.dto.MyChatRoomResponse;
import com.backend.domain.mypage.dto.MyMatchRequestResponse;
import com.backend.domain.mypage.dto.MyProjectResponse;
import com.backend.domain.mypage.dto.MyProjectsResponse;
import com.backend.domain.mypage.dto.MatchingPriceRequest;
import com.backend.domain.mypage.dto.MatchingPriceResponse;
import com.backend.domain.mypage.dto.PublicContentVisibilityRequest;
import com.backend.domain.mypage.dto.PublicContentVisibilityResponse;
import com.backend.domain.mypage.dto.PortfolioItemRequest;
import com.backend.domain.mypage.dto.PortfolioItemResponse;
import com.backend.domain.mypage.dto.TagsResponse;
import com.backend.domain.mypage.dto.UpdateTagsRequest;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.profile.repository.PortfolioRepository;
import com.backend.domain.profile.repository.UserTagRepository;
import com.backend.domain.mypage.entity.ChatRoomUser;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.entity.Message;
import com.backend.domain.mypage.repository.MyPageChatRoomUserRepository;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.mypage.repository.MyPageMessageRepository;
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

    private final MyPageChatRoomUserRepository chatRoomUserRepository;
    private final MyPageMessageRepository messageRepository;
    private final MyPageMatchRequestRepository matchRequestRepository;
    private final MyPageProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final UserTagRepository userTagRepository;
    private final PortfolioRepository portfolioRepository;

    public MyPageService(
            MyPageChatRoomUserRepository chatRoomUserRepository,
            MyPageMessageRepository messageRepository,
            MyPageMatchRequestRepository matchRequestRepository,
            MyPageProjectRepository projectRepository,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            UserTagRepository userTagRepository,
            PortfolioRepository portfolioRepository
    ) {
        this.chatRoomUserRepository = chatRoomUserRepository;
        this.messageRepository = messageRepository;
        this.matchRequestRepository = matchRequestRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.userTagRepository = userTagRepository;
        this.portfolioRepository = portfolioRepository;
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

    public List<PortfolioItemResponse> getPortfolios(String userId) {
        return portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .map(PortfolioItemResponse::from)
                .toList();
    }

    @Transactional
    public void savePortfolios(String userId, List<PortfolioItemRequest> items) {
        User user = getUser(userId);
        portfolioRepository.deleteByUser_Id(userId);
        portfolioRepository.flush();

        List<Portfolio> portfolios = new java.util.ArrayList<>();
        for (int i = 0; i < items.size(); i++) {
            PortfolioItemRequest item = items.get(i);
            String thumbnailUrl = "video".equals(item.type()) ? item.url() : null;
            String imageUrl = "image".equals(item.type()) ? item.url() : null;
            portfolios.add(new Portfolio(user, item.title(), thumbnailUrl, imageUrl, i + 1, item.representative()));
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

    private boolean hasRepresentativePortfolio(String userId) {
        return portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(userId)
                .stream()
                .anyMatch(Portfolio::isRepresentative);
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
