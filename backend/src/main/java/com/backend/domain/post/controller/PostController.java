package com.backend.domain.post.controller;

import com.backend.domain.post.dto.CommunityPostDetailResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.JobPostDetailResponse;
import com.backend.domain.post.dto.JobPostResponse;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.service.PostService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostController {

    private final PostService postService;

    // 구인/구직 목록 조회
    // GET /api/posts/job?postType=RECRUITING
    // GET /api/posts/job?postType=JOB_SEARCH
    @GetMapping("/job")
    public ResponseEntity<List<JobPostResponse>> getJobPosts(
            @RequestParam JobPost.PostType postType) {
        return ResponseEntity.ok(postService.getJobPosts(postType));
    }

    // 구인/구직 상세 조회
    // GET /api/posts/job/{id}
    @GetMapping("/job/{id}")
    public ResponseEntity<JobPostDetailResponse> getJobPost(@PathVariable String id) {
        return ResponseEntity.ok(postService.getJobPost(id));
    }

    // 커뮤니티 목록 조회
    // GET /api/posts/community?category=INFO
    // GET /api/posts/community?category=FREE
    @GetMapping("/community")
    public ResponseEntity<List<CommunityPostResponse>> getCommunityPosts(
            @RequestParam CommunityPost.Category category) {
        return ResponseEntity.ok(postService.getCommunityPosts(category));
    }

    // 커뮤니티 상세 조회
    // GET /api/posts/community/{id}
    @GetMapping("/community/{id}")
    public ResponseEntity<CommunityPostDetailResponse> getCommunityPost(@PathVariable String id) {
        return ResponseEntity.ok(postService.getCommunityPost(id));
    }
}
