package com.backend.domain.mypage.dto;

import com.backend.domain.user.entity.MatchPriceUnit;

public record MatchingPriceRequest(
        boolean matchEnabled,
        Integer matchPriceMin,
        Integer matchPriceMax,
        MatchPriceUnit matchPriceUnit,
        boolean representativePortfolioConfigured
) {}
