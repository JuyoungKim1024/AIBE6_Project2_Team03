package com.backend.domain.profile.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.profile.dto.ReviewCreateRequest;
import com.backend.domain.profile.dto.ReviewResponse;
import com.backend.domain.profile.service.ReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;
    private final AuthService authService;

    @PostMapping
    public ReviewResponse createReview(
            @RequestHeader("Authorization") String authorization,
            @RequestBody ReviewCreateRequest request
    ) {
        return reviewService.createReview(authService.resolveUserId(authorization), request);
    }
}
