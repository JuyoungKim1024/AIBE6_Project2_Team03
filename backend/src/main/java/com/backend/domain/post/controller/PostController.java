package com.backend.domain.post.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.post.dto.CommunityPostCreateRequest;
import com.backend.domain.post.dto.CommunityPostDetailResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.CommunityPostUpdateRequest;
import com.backend.domain.post.dto.JobPostCreateRequest;
import com.backend.domain.post.dto.JobPostUpdateRequest;
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

    // 구인/구직 수정
    @PatchMapping("/job/{id}")
    public ResponseEntity<Void> updateJobPost(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization,
            @RequestBody JobPostUpdateRequest request) {
        String userId = authService.resolveUserId(authorization);
        postService.updateJobPost(id, userId, request);
        return ResponseEntity.ok().build();
    }

    // 구인/구직 삭제
    @DeleteMapping("/job/{id}")
    public ResponseEntity<Void> deleteJobPost(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization) {
        String userId = authService.resolveUserId(authorization);
        postService.deleteJobPost(id, userId);
        return ResponseEntity.ok().build();
    }

    // 커뮤니티 글쓰기
    @PostMapping("/community")
    public ResponseEntity<Map<String, String>> createCommunityPost(
            @RequestHeader("Authorization") String authorization,
            @RequestBody CommunityPostCreateRequest request) {
        String userId = authService.resolveUserId(authorization);
        String id = postService.createCommunityPost(userId, request);
        return ResponseEntity.ok(Map.of("id", id));
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

    // 커뮤니티 수정
    @PatchMapping("/community/{id}")
    public ResponseEntity<Void> updateCommunityPost(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization,
            @RequestBody CommunityPostUpdateRequest request) {
        String userId = authService.resolveUserId(authorization);
        postService.updateCommunityPost(id, userId, request);
        return ResponseEntity.ok().build();
    }

    // 커뮤니티 삭제
    @DeleteMapping("/community/{id}")
    public ResponseEntity<Void> deleteCommunityPost(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization) {
        String userId = authService.resolveUserId(authorization);
        postService.deleteCommunityPost(id, userId);
        return ResponseEntity.ok().build();
    }

    // 조회수 증가
    @PostMapping("/{id}/view")
    public ResponseEntity<Void> incrementView(@PathVariable String id) {
        postService.incrementViewCount(id);
        return ResponseEntity.ok().build();
    }

    // 좋아요 토글
    @PostMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> toggleLike(
            @PathVariable String id,
            @RequestHeader("Authorization") String authorization) {
        String userId = authService.resolveUserId(authorization);
        return ResponseEntity.ok(postService.toggleLike(id, userId));
    }

    // 좋아요 상태 조회
    @GetMapping("/{id}/like")
    public ResponseEntity<Map<String, Object>> getLikedStatus(
            @PathVariable String id,
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null) {
            return ResponseEntity.ok(Map.of("liked", false));
        }
        String userId = authService.resolveUserId(authorization);
        boolean liked = postService.isLiked(id, userId);
        return ResponseEntity.ok(Map.of("liked", liked));
    }

    // 현재 유저가 좋아요한 게시글 ID 목록
    @GetMapping("/liked")
    public ResponseEntity<List<String>> getLikedPostIds(
            @RequestHeader(value = "Authorization", required = false) String authorization) {
        if (authorization == null) {
            return ResponseEntity.ok(List.of());
        }
        String userId = authService.resolveUserId(authorization);
        return ResponseEntity.ok(postService.getLikedPostIds(userId));
    }
}
