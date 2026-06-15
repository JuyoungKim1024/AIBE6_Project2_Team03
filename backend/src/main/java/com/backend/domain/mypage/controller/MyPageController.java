package com.backend.domain.mypage.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.mypage.dto.MyChatRoomResponse;
import com.backend.domain.mypage.dto.MyProjectsResponse;
import com.backend.domain.mypage.dto.MatchingPriceRequest;
import com.backend.domain.mypage.dto.MatchingPriceResponse;
import com.backend.domain.mypage.dto.PortfolioItemRequest;
import com.backend.domain.mypage.dto.PortfolioItemResponse;
import com.backend.domain.mypage.dto.PublicContentVisibilityRequest;
import com.backend.domain.mypage.dto.PublicContentVisibilityResponse;
import com.backend.domain.mypage.dto.TagsResponse;
import com.backend.domain.mypage.dto.UpdateTagsRequest;
import com.backend.domain.mypage.service.MyPageService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
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

    @GetMapping("/portfolios")
    public List<PortfolioItemResponse> getPortfolios(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getPortfolios(authService.resolveUserId(authorizationHeader));
    }

    @PutMapping("/portfolios")
    public ResponseEntity<Void> savePortfolios(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody List<PortfolioItemRequest> items
    ) {
        myPageService.savePortfolios(authService.resolveUserId(authorizationHeader), items);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/tags")
    public TagsResponse getTags(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getTags(authService.resolveUserId(authorizationHeader));
    }

    @PutMapping("/tags")
    public ResponseEntity<Void> updateTags(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody UpdateTagsRequest request
    ) {
        myPageService.updateTags(authService.resolveUserId(authorizationHeader), request);
        return ResponseEntity.ok().build();
    }
}
