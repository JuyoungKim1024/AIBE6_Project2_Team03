package com.backend.domain.market.service;

import com.backend.domain.market.dto.MarketPriceResponse;
import com.backend.domain.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class MarketService {

    private final ProjectRepository projectRepository;

    private static final List<String> TARGET_FIELDS = List.of("롱폼", "숏폼", "썸네일");
    private static final Map<String, String> LABEL_MAP = Map.of(
            "롱폼", "롱폼 편집 평균",
            "숏폼", "숏폼 편집 평균",
            "썸네일", "썸네일 제작 평균"
    );
    private static final Map<String, String> UNIT_MAP = Map.of(
            "롱폼", "분",
            "숏폼", "건",
            "썸네일", "건"
    );

    public List<MarketPriceResponse> getMarketPrices() {
        List<Object[]> rows = projectRepository.findAvgPriceByFields(TARGET_FIELDS);

        // field별 가중 평균 집계
        Map<String, long[]> agg = new java.util.LinkedHashMap<>();
        for (String f : TARGET_FIELDS) agg.put(f, new long[]{0, 0}); // [weightedSum, count]

        for (Object[] row : rows) {
            String field = (String) row[0];
            double avg = ((Number) row[1]).doubleValue();
            long count = ((Number) row[3]).longValue();
            if (agg.containsKey(field)) {
                long[] cur = agg.get(field);
                agg.put(field, new long[]{cur[0] + (long)(avg * count), cur[1] + count});
            }
        }

        List<MarketPriceResponse> result = new ArrayList<>();
        for (String field : TARGET_FIELDS) {
            long[] v = agg.get(field);
            if (v[1] > 0) {
                result.add(new MarketPriceResponse(
                        LABEL_MAP.get(field),
                        (int)(v[0] / v[1]),
                        UNIT_MAP.get(field)
                ));
            }
        }
        return result;
    }
}
