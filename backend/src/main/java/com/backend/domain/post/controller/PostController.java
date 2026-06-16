package com.backend.domain.post.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.post.dto.CommunityPostDetailResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.JobPostCreateRequest;
import com.backend.domain.post.dto.JobPostDetailResponse;
import com.backend.domain.post.dto.JobPostResponse;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;
    private final AuthService authService;

    // 구인/구직 목록 조회
    @GetMapping("/job")
    public ResponseEntity<List<JobPostResponse>> getJobPosts(
            @RequestParam(required = false) JobPost.PostType postType,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(postService.getJobPosts(postType, q));
    }

    // 구인/구직 글쓰기
    @PostMapping("/job")
    public ResponseEntity<Map<String, String>> createJobPost(
            @RequestHeader("Authorization") String authorization,
            @RequestBody JobPostCreateRequest request) {
        String userId = authService.resolveUserId(authorization);
        String id = postService.createJobPost(userId, request);
        return ResponseEntity.ok(Map.of("id", id));
    }

    // 구인/구직 상세 조회
    @GetMapping("/job/{id}")
    public ResponseEntity<JobPostDetailResponse> getJobPost(@PathVariable String id) {
        return ResponseEntity.ok(postService.getJobPost(id));
    }

    // 커뮤니티 목록 조회
    @GetMapping("/community")
    public ResponseEntity<List<CommunityPostResponse>> getCommunityPosts(
            @RequestParam(required = false) CommunityPost.Category category,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(postService.getCommunityPosts(category, q));
    }

    // 커뮤니티 상세 조회
    @GetMapping("/community/{id}")
    public ResponseEntity<CommunityPostDetailResponse> getCommunityPost(@PathVariable String id) {
        return ResponseEntity.ok(postService.getCommunityPost(id));
    }
}
