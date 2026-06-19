package com.backend.domain.chat.dto;

public record ChatPostSummaryDTO (
        String id,
        String title,
        Integer priceMin,
        Integer priceMax
){
}
