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
    // GET /api/posts/job?q=키워드 (전체 타입 검색)
    // GET /api/posts/job?postType=RECRUITING&q=키워드
    @GetMapping("/job")
    public ResponseEntity<List<JobPostResponse>> getJobPosts(
            @RequestParam(required = false) JobPost.PostType postType,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(postService.getJobPosts(postType, q));
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
    // GET /api/posts/community?q=키워드 (전체 카테고리 검색)
    // GET /api/posts/community?category=INFO&q=키워드
    @GetMapping("/community")
    public ResponseEntity<List<CommunityPostResponse>> getCommunityPosts(
            @RequestParam(required = false) CommunityPost.Category category,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(postService.getCommunityPosts(category, q));
    }

    // 커뮤니티 상세 조회
    // GET /api/posts/community/{id}
    @GetMapping("/community/{id}")
    public ResponseEntity<CommunityPostDetailResponse> getCommunityPost(@PathVariable String id) {
        return ResponseEntity.ok(postService.getCommunityPost(id));
    }
}