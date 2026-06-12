package com.backend.domain.mypage.dto;

import com.backend.domain.user.entity.MatchPriceUnit;

public record MatchingPriceResponse(
        boolean matchEnabled,
        Integer matchPrice,
        MatchPriceUnit matchPriceUnit,
        boolean representativePortfolioConfigured
) {
}
