package com.backend.domain.mypage.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.chat.dto.MyChatRoomResponseDTO;
import com.backend.domain.mypage.dto.*;
import com.backend.domain.mypage.service.MyPageService;
import org.springframework.http.ResponseEntity;
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

    @GetMapping("/posts")
    public List<MyPostResponse> getPosts(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getPosts(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/posts/{postId}/visibility")
    public MyPostResponse updatePostVisibility(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String postId,
            @RequestBody PostVisibilityRequest request
    ) {
        return myPageService.updatePostVisibility(authService.resolveUserId(authorizationHeader), postId, request);
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @RequestHeader("Authorization") String authorizationHeader,
            @PathVariable String postId
    ) {
        myPageService.deletePost(authService.resolveUserId(authorizationHeader), postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/portfolios")
    public List<PortfolioItemResponse> getPortfolios(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getPortfolios(authService.resolveUserId(authorizationHeader));
    }

    @GetMapping("/portfolio-groups")
    public List<PortfolioGroupResponse> getPortfolioGroups(@RequestHeader("Authorization") String authorizationHeader) {
        return myPageService.getPortfolioGroups(authService.resolveUserId(authorizationHeader));
    }

    @PutMapping("/portfolio-groups")
    public List<PortfolioGroupResponse> savePortfolioGroups(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody List<PortfolioGroupRequest> groups
    ) {
        return myPageService.savePortfolioGroups(authService.resolveUserId(authorizationHeader), groups);
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
