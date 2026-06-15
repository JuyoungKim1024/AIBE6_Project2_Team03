package com.backend.domain.matching.service;

import com.backend.domain.matching.dto.BlindEditorResponse;
import com.backend.domain.matching.dto.MatchRequestBody;
import com.backend.domain.matching.dto.MatchRequestResponse;
import com.backend.domain.mypage.entity.MatchRequest;
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
    public List<BlindEditorResponse> searchEditors(String category, String tool, String videoLength, Integer maxPrice) {
        List<BlindEditorResponse> results = new ArrayList<>();
        for (User user : userRepository.findMatchableEditors(maxPrice)) {
            if (results.size() >= MAX_RESULTS) break;
            List<UserTag> tags = userTagRepository.findByUser_IdOrderByTagNameAsc(user.getId());
            if (matchesFilters(tags, category, tool, videoLength)) {
                List<Portfolio> portfolios = portfolioRepository.findByUser_IdOrderByDisplayOrderAsc(user.getId());
                results.add(BlindEditorResponse.of(user, tags, portfolios));
            }
        }
        return results;
    }

    private boolean matchesFilters(List<UserTag> tags, String category, String tool, String videoLength) {
        if (category != null && !category.isBlank()) {
            boolean hasCategory = tags.stream()
                    .filter(t -> t.getTagType() == UserTagType.FIELD)
                    .anyMatch(t -> t.getTagName().equalsIgnoreCase(category));
            if (!hasCategory) return false;
        }
        if (tool != null && !tool.isBlank() && !tool.equals("상관없음")) {
            boolean hasTool = tags.stream()
                    .filter(t -> t.getTagType() == UserTagType.TOOL)
                    .anyMatch(t -> t.getTagName().equalsIgnoreCase(tool));
            if (!hasTool) return false;
        }
        if (videoLength != null && !videoLength.isBlank() && !videoLength.equals("상관없음")) {
            boolean hasVideoLength = tags.stream()
                    .filter(t -> t.getTagType() == UserTagType.CONTENT_TYPE)
                    .anyMatch(t -> t.getTagName().equalsIgnoreCase(videoLength));
            if (!hasVideoLength) return false;
        }
        return true;
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
        User requester = userRepository.findById(requesterId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        User editor = userRepository.findById(body.editorId())
                .orElseThrow(() -> new IllegalArgumentException("에디터를 찾을 수 없습니다."));

        if (!editor.isMatchEnabled()) {
            throw new IllegalArgumentException("맞춤매칭 OFF 상태인 에디터입니다.");
        }

        MatchRequest request = new MatchRequest(requester, editor);
        matchRequestRepository.save(request);
        return new MatchRequestResponse(request.getId());
    }
}
