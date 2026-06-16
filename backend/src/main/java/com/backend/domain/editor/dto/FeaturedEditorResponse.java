package com.backend.domain.editor.dto;

import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.User;

import java.util.List;

public record FeaturedEditorResponse(
        String id,
        String nickname,
        String avatar,
        List<String> tags,
        Integer matchPriceMin,
        Integer matchPriceMax,
        String matchPriceUnit,
        double rating,
        String thumbnailUrl
) {
    public static FeaturedEditorResponse of(User user, List<UserTag> tags, double rating, Portfolio representativePortfolio) {
        String thumbnail = representativePortfolio != null ? representativePortfolio.getThumbnailUrl() : null;
        String unitLabel = user.getMatchPriceUnit() == MatchPriceUnit.MIN ? "원/분" : "원/건";
        return new FeaturedEditorResponse(
                user.getId(),
                user.getNickname(),
                user.getProfileImage(),
                tags.stream().map(UserTag::getTagName).toList(),
                user.getMatchPriceMin(),
                user.getMatchPriceMax(),
                unitLabel,
                Math.round(rating * 10.0) / 10.0,
                thumbnail
        );
    }
}
