package com.backend.domain.mypage.dto;

import java.util.List;

public record TagsResponse(
        List<String> fields,
        List<String> tools,
        List<String> contentTypes
) {}
