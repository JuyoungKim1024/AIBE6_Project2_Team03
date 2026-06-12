package com.backend.domain.mypage.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.mypage.dto.MyChatRoomResponse;
import com.backend.domain.mypage.dto.MyProjectsResponse;
import com.backend.domain.mypage.dto.MatchingPriceRequest;
import com.backend.domain.mypage.dto.MatchingPriceResponse;
import com.backend.domain.mypage.dto.PublicContentVisibilityRequest;
import com.backend.domain.mypage.dto.PublicContentVisibilityResponse;
import com.backend.domain.mypage.service.MyPageService;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class MyPageController {

    private final AuthService authService;
    private final MyPageService myPageService;

    public MyPageController(AuthService authService, MyPageService myPageService) {
        this.authService = authService;
        this.myPageService = myPageService;
    }

    @GetMapping("/chats")
    public List<MyChatRoomResponse> getChatRooms(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getChatRooms(authService.resolveUserId(authorizationHeader));
    }

    @GetMapping("/projects")
    public MyProjectsResponse getProjects(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getProjects(authService.resolveUserId(authorizationHeader));
    }

    @GetMapping("/matching-price")
    public MatchingPriceResponse getMatchingPrice(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getMatchingPrice(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/matching-price")
    public MatchingPriceResponse updateMatchingPrice(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody MatchingPriceRequest request
    ) {
        return myPageService.updateMatchingPrice(authService.resolveUserId(authorizationHeader), request);
    }

    @GetMapping("/public-content-visibility")
    public PublicContentVisibilityResponse getPublicContentVisibility(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getPublicContentVisibility(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/public-content-visibility")
    public PublicContentVisibilityResponse updatePublicContentVisibility(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody PublicContentVisibilityRequest request
    ) {
        return myPageService.updatePublicContentVisibility(authService.resolveUserId(authorizationHeader), request);
    }
}
