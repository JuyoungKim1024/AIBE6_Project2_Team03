package com.backend.domain.mypage.dto;

import java.util.List;

public record UpdateTagsRequest(
        List<String> fields,       // FIELD 태그 (세부분야: 게임, 여행, 브이로그 ...)
        List<String> tools,        // TOOL 태그 (영상편집툴 + 디자인툴)
        List<String> contentTypes  // CONTENT_TYPE 태그 (분야: 롱폼, 숏폼, 썸네일)
) {}
