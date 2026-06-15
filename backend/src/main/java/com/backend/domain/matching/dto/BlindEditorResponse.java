package com.backend.domain.matching.dto;

import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.User;

import java.util.List;

public record BlindEditorResponse(
        String id,
        List<String> thumbnails,
        List<String> categories,
        List<String> tools,
        Integer matchPrice,
        String matchPriceUnit
) {
    public static BlindEditorResponse of(User user, List<UserTag> tags, List<Portfolio> portfolios) {
        List<String> categories = tags.stream()
                .filter(t -> t.getTagType().name().equals("FIELD"))
                .map(UserTag::getTagName)
                .toList();

        List<String> tools = tags.stream()
                .filter(t -> t.getTagType().name().equals("TOOL"))
                .map(UserTag::getTagName)
                .toList();

        List<String> thumbnails = portfolios.stream()
                .map(Portfolio::getThumbnailUrl)
                .filter(url -> url != null && !url.isBlank())
                .limit(2)
                .toList();

        String unitLabel = user.getMatchPriceUnit() == MatchPriceUnit.MIN ? "원/분" : "원/건";

        return new BlindEditorResponse(
                user.getId(),
                thumbnails,
                categories,
                tools,
                user.getMatchPrice(),
                unitLabel
        );
    }
}
