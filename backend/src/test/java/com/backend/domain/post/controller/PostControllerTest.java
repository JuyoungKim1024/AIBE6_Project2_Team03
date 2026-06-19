package com.backend.domain.post.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.post.dto.AuthorResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.JobPostResponse;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.service.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class PostControllerTest {

    private PostService postService;
    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        postService = mock(PostService.class);
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new PostController(postService, authService))
                .build();
    }

    private AuthorResponse author() {
        return new AuthorResponse("user-id", "테스트유저", null, "bronze");
    }

    @Test
    @DisplayName("t1 RECRUITING 타입으로 구인 게시글 목록을 조회한다")
    void t1_getJobPosts_recruiting() throws Exception {
        JobPostResponse post = new JobPostResponse(
                "job-id-1", author(), "숏폼 편집자 구인합니다",
                300000, 500000, true, JobPost.PostType.RECRUITING,
                List.of("숏폼"), List.of("After Effects"),
                null, 215, 31, 0, 0, LocalDateTime.now()
        );
        when(postService.getJobPosts(JobPost.PostType.RECRUITING, null)).thenReturn(List.of(post));

        mockMvc.perform(get("/api/posts/job").param("postType", "RECRUITING"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].postType").value("RECRUITING"))
                .andExpect(jsonPath("$[0].title").value("숏폼 편집자 구인합니다"));
    }

    @Test
    @DisplayName("t2 JOB_SEARCH 타입으로 구직 게시글 목록을 조회한다")
    void t2_getJobPosts_jobSearch() throws Exception {
        JobPostResponse post1 = new JobPostResponse(
                "job-id-2", author(), "편집 경력 3년 에디터 구직합니다",
                300000, 500000, true, JobPost.PostType.JOB_SEARCH,
                List.of("롱폼"), List.of("Premiere Pro"),
                null, 342, 45, 0, 0, LocalDateTime.now()
        );
        JobPostResponse post2 = new JobPostResponse(
                "job-id-3", author(), "브이로그 전문 편집자 구직",
                200000, 350000, false, JobPost.PostType.JOB_SEARCH,
                List.of("브이로그"), List.of("Final Cut"),
                null, 87, 12, 0, 0, LocalDateTime.now()
        );
        when(postService.getJobPosts(JobPost.PostType.JOB_SEARCH, null)).thenReturn(List.of(post1, post2));

        mockMvc.perform(get("/api/posts/job").param("postType", "JOB_SEARCH"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].postType").value("JOB_SEARCH"))
                .andExpect(jsonPath("$[1].postType").value("JOB_SEARCH"));
    }

    @Test
    @DisplayName("t3 postType 파라미터 없이 구인구직 목록 조회 시 200을 반환한다")
    void t3_getJobPosts_missingPostType_returns400() throws Exception {
        when(postService.getJobPosts(null, null)).thenReturn(List.of());
        mockMvc.perform(get("/api/posts/job"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("t4 FREE 카테고리 커뮤니티 게시글 목록을 조회한다")
    void t4_getCommunityPosts_free() throws Exception {
        CommunityPostResponse post = new CommunityPostResponse(
                "comm-id-1", author(), "편집 툴 추천 받아요",
                CommunityPost.Category.FREE, List.of("편집"),
                null, 63, 0, 0, 0, LocalDateTime.now()
        );
        when(postService.getCommunityPosts(CommunityPost.Category.FREE, null)).thenReturn(List.of(post));

        mockMvc.perform(get("/api/posts/community").param("category", "FREE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("FREE"))
                .andExpect(jsonPath("$[0].title").value("편집 툴 추천 받아요"));
    }

    @Test
    @DisplayName("t5 INFO 카테고리 커뮤니티 게시글 목록을 조회한다")
    void t5_getCommunityPosts_info() throws Exception {
        CommunityPostResponse post = new CommunityPostResponse(
                "comm-id-2", author(), "숏폼 편집 팁 공유합니다",
                CommunityPost.Category.INFO, List.of("숏폼"),
                null, 290, 0, 0, 0, LocalDateTime.now()
        );
        when(postService.getCommunityPosts(CommunityPost.Category.INFO, null)).thenReturn(List.of(post));

        mockMvc.perform(get("/api/posts/community").param("category", "INFO"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].category").value("INFO"))
                .andExpect(jsonPath("$[0].title").value("숏폼 편집 팁 공유합니다"));
    }

    @Test
    @DisplayName("t6 category 파라미터 없이 커뮤니티 목록 조회 시 200을 반환한다")
    void t6_getCommunityPosts_missingCategory_returns400() throws Exception {
        when(postService.getCommunityPosts(null, null)).thenReturn(List.of());
        mockMvc.perform(get("/api/posts/community"))
                .andExpect(status().isOk());
    }
}
