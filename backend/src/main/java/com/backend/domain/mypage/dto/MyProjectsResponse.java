package com.backend.domain.mypage.dto;

import java.util.List;

public record MyProjectsResponse(
        List<MyMatchRequestResponse> received,
        List<MyProjectResponse> ongoing
) {
}
