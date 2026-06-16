package com.backend.domain.mypage.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.dto.MyChatRoomResponseDTO;
import com.backend.domain.mypage.dto.*;
import com.backend.domain.mypage.service.MyPageService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public List<MyChatRoomResponseDTO> getChatRooms(@RequestHeader("Authorization") String authorizationHeader) {
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
