package com.backend.domain.chat.dto;

import java.util.List;

public record ChatPostSummaryDTO (
        String id,
        String title,
        Integer priceMin,
        Integer priceMax,
        List<String> fieldTags,
        Integer revisionCount
){
}
