package com.backend.domain.matching.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.matching.dto.BlindEditorResponse;
import com.backend.domain.matching.dto.MatchRequestBody;
import com.backend.domain.matching.dto.MatchRequestResponse;
import com.backend.domain.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/matching")
@RequiredArgsConstructor
public class MatchingController {

    private final AuthService authService;
    private final MatchingService matchingService;

    // GET /api/matching/editors?category=게임&tool=Premiere Pro&maxPrice=15000
    @GetMapping("/editors")
    public List<BlindEditorResponse> searchEditors(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String tool,
            @RequestParam(required = false) Integer maxPrice) {
        return matchingService.searchEditors(category, tool, maxPrice);
    }

    // GET /api/matching/editors/{editorId}
    @GetMapping("/editors/{editorId}")
    public BlindEditorResponse getEditorDetail(@PathVariable String editorId) {
        return matchingService.getEditorDetail(editorId);
    }

    // POST /api/matching/requests
    @PostMapping("/requests")
    public ResponseEntity<MatchRequestResponse> sendRequest(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody MatchRequestBody body) {
        String requesterId = authService.resolveUserId(authorizationHeader);
        return ResponseEntity.ok(matchingService.sendRequest(requesterId, body));
    }
}
