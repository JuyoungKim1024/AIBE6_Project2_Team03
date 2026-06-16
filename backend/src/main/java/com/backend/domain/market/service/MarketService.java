package com.backend.domain.market.service;

import com.backend.domain.market.dto.MarketPriceResponse;
import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.UserRole;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final UserRepository userRepository;

    public List<MarketPriceResponse> getMarketPrices() {
        List<MarketPriceResponse> result = new ArrayList<>();

        Double minAvg = userRepository.avgMatchPriceByRoleAndUnit(UserRole.EDITOR, MatchPriceUnit.MIN);
        if (minAvg != null) {
            result.add(new MarketPriceResponse("분당 편집 평균", minAvg.intValue(), "원/분"));
        }

        Double caseAvg = userRepository.avgMatchPriceByRoleAndUnit(UserRole.EDITOR, MatchPriceUnit.CASE);
        if (caseAvg != null) {
            result.add(new MarketPriceResponse("건당 작업 평균", caseAvg.intValue(), "원/건"));
        }

        return result;
    }
}
