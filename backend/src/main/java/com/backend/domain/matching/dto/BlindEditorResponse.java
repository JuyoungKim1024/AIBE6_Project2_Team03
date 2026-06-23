package com.backend.domain.matching.dto;

import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.User;

import java.util.Comparator;
import java.util.List;

public record BlindEditorResponse(
        String id,
        List<PortfolioPreview> portfolios,
        List<String> categories,
        List<String> tools,
        List<String> videoLengths,
        Integer matchPriceMin,
        Integer matchPriceMax,
        String matchPriceUnit
) {
    public record PortfolioPreview(String url, String type) {}

    public static BlindEditorResponse of(User user, List<UserTag> tags, List<Portfolio> portfolios) {
        List<String> categories = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.FIELD)
                .map(UserTag::getTagName)
                .toList();

        List<String> tools = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.TOOL)
                .map(UserTag::getTagName)
                .toList();

        List<String> videoLengths = tags.stream()
                .filter(t -> t.getTagType() == UserTagType.CONTENT_TYPE)
                .map(UserTag::getTagName)
                .toList();

        boolean hasGroupedPortfolio = portfolios.stream().anyMatch(p -> p.getGroup() != null);
        List<PortfolioPreview> previews = portfolios.stream()
                .filter(p -> !hasGroupedPortfolio || (p.getGroup() != null && p.getGroup().isRepresentative()))
                .sorted(Comparator.comparingInt(Portfolio::getDisplayOrder))
                .map(p -> {
                    boolean isImage = p.getImageUrl() != null && p.getThumbnailUrl() == null;
                    String url = isImage ? p.getImageUrl() : p.getThumbnailUrl();
                    String type = isImage ? "image" : "video";
                    return new PortfolioPreview(url, type);
                })
                .filter(preview -> preview.url() != null && !preview.url().isBlank())
                .limit(2)
                .toList();

        String unitLabel = user.getMatchPriceUnit() == MatchPriceUnit.MIN ? "분" : "건";

        return new BlindEditorResponse(
                user.getId(),
                previews,
                categories,
                tools,
                videoLengths,
                user.getMatchPriceMin(),
                user.getMatchPriceMax(),
                unitLabel
        );
    }
}
