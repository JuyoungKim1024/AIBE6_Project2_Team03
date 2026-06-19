package com.backend.domain.matching.service;

import com.backend.domain.matching.dto.BlindEditorResponse;
import com.backend.domain.matching.dto.MatchRequestBody;
import com.backend.domain.matching.dto.MatchRequestResponse;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.profile.repository.PortfolioRepository;
import com.backend.domain.profile.repository.UserTagRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MatchingService {

    private static final int MAX_RESULTS = 5;

    private final UserRepository userRepository;
    private final UserTagRepository userTagRepository;
    private final PortfolioRepository portfolioRepository;
    private final MyPageMatchRequestRepository matchRequestRepository;

    // GET /api/matching/editors
    public List<BlindEditorResponse> searchEditors(List<String> categories, List<String> tools, List<String> videoLengths, Integer minPrice, Integer maxPrice) {
        List<BlindEditorResponse> results = new ArrayList<>();
        for (User user : userRepository.findMatchableEditors(maxPrice, minPrice)) {
            if (results.size() >= MAX_RESULTS) break;
            List<UserTag> tags = userTagRepository.findByUser_IdOrderByTagNameAsc(user.getId());
            if (matchesFilters(tags, categories, tools, videoLengths)) {
                List<Portfolio> portfolios = portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(user.getId());
                results.add(BlindEditorResponse.of(user, tags, portfolios));
            }
        }
        return results;
    }

    private boolean matchesFilters(List<UserTag> tags, List<String> categories, List<String> tools, List<String> videoLengths) {
        if (categories != null && !categories.isEmpty()) {
            if (!hasAnyTag(tags, UserTagType.FIELD, categories)) return false;
        }
        if (tools != null && !tools.isEmpty()) {
            if (!hasAnyTag(tags, UserTagType.TOOL, tools)) return false;
        }
        if (videoLengths != null && !videoLengths.isEmpty()) {
            if (!hasAnyTag(tags, UserTagType.CONTENT_TYPE, videoLengths)) return false;
        }
        return true;
    }

    private boolean hasAnyTag(List<UserTag> tags, UserTagType type, List<String> values) {
        return tags.stream()
                .filter(t -> t.getTagType() == type)
                .anyMatch(t -> values.stream().anyMatch(v -> v.equalsIgnoreCase(t.getTagName())));
    }

    // GET /api/matching/editors/random
    public List<BlindEditorResponse> getRandomEditors(int count) {
        return userRepository.findRandomMatchableEditors(count).stream()
                .map(user -> {
                    List<UserTag> tags = userTagRepository.findByUser_IdOrderByTagNameAsc(user.getId());
                    List<Portfolio> portfolios = portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(user.getId());
                    return BlindEditorResponse.of(user, tags, portfolios);
                })
                .toList();
    }

    // GET /api/matching/editors/{editorId}
    public BlindEditorResponse getEditorDetail(String editorId) {
        User user = userRepository.findById(editorId)
                .orElseThrow(() -> new IllegalArgumentException("에디터를 찾을 수 없습니다."));
        List<UserTag> tags = userTagRepository.findByUser_IdOrderByTagNameAsc(editorId);
        List<Portfolio> portfolios = portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(editorId);
        return BlindEditorResponse.of(user, tags, portfolios);
    }

    // POST /api/matching/requests
    @Transactional
    public MatchRequestResponse sendRequest(String requesterId, MatchRequestBody body) {
        if (requesterId.equals(body.editorId())) {
            throw new IllegalArgumentException("자기 자신에게 매칭 요청을 보낼 수 없습니다.");
        }

        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        User editor = userRepository.findById(body.editorId())
                .orElseThrow(() -> new IllegalArgumentException("에디터를 찾을 수 없습니다."));

        if (!editor.isMatchEnabled()) {
            throw new IllegalArgumentException("맞춤매칭 OFF 상태인 에디터입니다.");
        }

        if (matchRequestRepository.existsByRequester_IdAndEditor_IdAndStatus(requesterId, body.editorId(), MatchRequestStatus.WAITING)) {
            throw new IllegalArgumentException("이미 매칭 요청을 보낸 에디터입니다. 에디터의 수락을 기다려주세요.");
        }

        MatchRequest request = new MatchRequest(requester, editor);
        matchRequestRepository.save(request);
        return new MatchRequestResponse(request.getId());
    }
}
