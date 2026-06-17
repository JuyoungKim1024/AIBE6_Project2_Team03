package com.backend.domain.matching.controller;

import com.backend.domain.auth.service.JwtTokenProvider;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.mypage.repository.MyPageMatchRequestRepository;
import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;
import com.backend.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.handler;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class MatchingControllerTest {

    @Autowired WebApplicationContext context;
    @Autowired JwtTokenProvider jwtTokenProvider;
    @Autowired UserRepository userRepository;
    @Autowired JdbcTemplate jdbcTemplate;
    @Autowired MyPageMatchRequestRepository matchRequestRepository;

    private MockMvc mockMvc;
    private User requester;
    private User editor;
    private String requesterToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();

        requester = new User(SocialProvider.GOOGLE, "google-req-1", "req@test.com", "유튜버테스터", null);
        requester.updateRole(UserRole.YOUTUBER);
        userRepository.saveAndFlush(requester);

        editor = new User(SocialProvider.GOOGLE, "google-ed-1", "ed@test.com", "에디터테스터", "https://example.com/avatar.jpg");
        editor.updateRole(UserRole.EDITOR);
        editor.updateMatchingPrice(true, 15000, 50000, MatchPriceUnit.MIN);
        userRepository.saveAndFlush(editor);

        jdbcTemplate.update(
                "INSERT INTO user_tags (id, user_id, tag_type, tag_name) VALUES (?, ?, 'FIELD', '게임')",
                UUID.randomUUID().toString(), editor.getId()
        );
        jdbcTemplate.update(
                "INSERT INTO user_tags (id, user_id, tag_type, tag_name) VALUES (?, ?, 'TOOL', 'Premiere Pro')",
                UUID.randomUUID().toString(), editor.getId()
        );
        jdbcTemplate.update(
                "INSERT INTO user_tags (id, user_id, tag_type, tag_name) VALUES (?, ?, 'CONTENT_TYPE', '숏폼')",
                UUID.randomUUID().toString(), editor.getId()
        );
        jdbcTemplate.update(
                "INSERT INTO portfolios (id, user_id, title, thumbnail_url, display_order, is_representative) VALUES (?, ?, '대표 포트폴리오', 'https://example.com/thumb.jpg', 1, true)",
                UUID.randomUUID().toString(), editor.getId()
        );

        requesterToken = "Bearer " + jwtTokenProvider.createAccessToken(requester.getId());
    }

    @Test
    @DisplayName("t1 카테고리와 단가 조건에 맞는 에디터 목록을 반환한다")
    void t1_searchEditors_returnsMatchingEditors() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "게임")
                        .param("maxPrice", "20000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(editor.getId()))
                .andExpect(jsonPath("$[0].thumbnails").isArray())
                .andExpect(jsonPath("$[0].thumbnails[0]").value("https://example.com/thumb.jpg"))
                .andExpect(jsonPath("$[0].categories[0]").value("게임"))
                .andExpect(jsonPath("$[0].tools[0]").value("Premiere Pro"))
                .andExpect(jsonPath("$[0].videoLengths[0]").value("숏폼"))
                .andExpect(jsonPath("$[0].matchPriceUnit").value("분"));
    }

    @Test
    @DisplayName("t1-2 여러 카테고리 중 하나라도 일치하는 에디터를 반환한다")
    void t1_2_searchEditors_returnsEditorWhenAnyCategoryMatches() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "여행")
                        .param("categories", "게임")
                        .param("maxPrice", "20000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(editor.getId()));
    }

    @Test
    @DisplayName("t2 단가 범위를 초과하는 에디터는 결과에서 제외된다")
    void t2_searchEditors_excludesEditorExceedingMaxPrice() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "게임")
                        .param("maxPrice", "10000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("t3 카테고리가 일치하지 않으면 빈 배열을 반환한다")
    void t3_searchEditors_returnsEmptyWhenCategoryNotMatched() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "뷰티")
                        .param("maxPrice", "20000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("t3-2 툴이 일치하지 않으면 빈 배열을 반환한다")
    void t3_2_searchEditors_returnsEmptyWhenToolNotMatched() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "게임")
                        .param("tools", "Final Cut Pro")
                        .param("maxPrice", "20000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("t3-3 툴 다중선택 시 하나라도 일치하면 에디터를 반환한다")
    void t3_3_searchEditors_returnsEditorWhenAnyToolMatches() throws Exception {
        mockMvc.perform(get("/api/matching/editors")
                        .param("categories", "게임")
                        .param("tools", "Final Cut Pro")
                        .param("tools", "Premiere Pro")
                        .param("maxPrice", "20000"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("searchEditors"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(editor.getId()));
    }

    @Test
    @DisplayName("t4 에디터 ID로 블라인드 상세 프로필을 조회한다")
    void t4_getEditorDetail_returnsBlindProfile() throws Exception {
        mockMvc.perform(get("/api/matching/editors/{id}", editor.getId()))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("getEditorDetail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(editor.getId()))
                .andExpect(jsonPath("$.thumbnails[0]").value("https://example.com/thumb.jpg"))
                .andExpect(jsonPath("$.categories[0]").value("게임"))
                .andExpect(jsonPath("$.tools[0]").value("Premiere Pro"))
                .andExpect(jsonPath("$.videoLengths[0]").value("숏폼"))
                .andExpect(jsonPath("$.matchPriceUnit").value("분"));
    }

    @Test
    @DisplayName("t5 존재하지 않는 에디터 ID 조회 시 400을 반환한다")
    void t5_getEditorDetail_returns400WhenNotFound() throws Exception {
        mockMvc.perform(get("/api/matching/editors/{id}", "non-existent-id"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("getEditorDetail"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("에디터를 찾을 수 없습니다."));
    }

    @Test
    @DisplayName("t6 유튜버가 에디터에게 매칭 요청을 전송하면 matchRequestId를 반환한다")
    void t6_sendRequest_createsMatchRequestAndReturnsId() throws Exception {
        mockMvc.perform(post("/api/matching/requests")
                        .header("Authorization", requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"editorId\":\"" + editor.getId() + "\"}"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("sendRequest"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.matchRequestId").isString());

        long count = matchRequestRepository.findByEditor_IdAndStatusOrderByCreatedAtDesc(
                editor.getId(), MatchRequestStatus.WAITING
        ).size();
        assertThat(count).isEqualTo(1);
    }

    @Test
    @DisplayName("t7 matchEnabled가 false인 에디터에게 매칭 요청 시 400을 반환한다")
    void t7_sendRequest_returns400WhenEditorMatchDisabled() throws Exception {
        editor.updateMatchingPrice(false, null, null, null);
        userRepository.save(editor);

        mockMvc.perform(post("/api/matching/requests")
                        .header("Authorization", requesterToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"editorId\":\"" + editor.getId() + "\"}"))
                .andDo(print())
                .andExpect(handler().handlerType(MatchingController.class))
                .andExpect(handler().methodName("sendRequest"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("맞춤매칭 OFF 상태인 에디터입니다."));
    }
}
