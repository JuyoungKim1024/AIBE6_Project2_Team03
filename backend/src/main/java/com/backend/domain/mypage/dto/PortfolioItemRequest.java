package com.backend.domain.mypage.dto;

public record PortfolioItemRequest(
        String title,
        String url,           // 업로드된 파일 URL
        String type,          // "video" | "image"
        boolean representative,
        int displayOrder
) {}
