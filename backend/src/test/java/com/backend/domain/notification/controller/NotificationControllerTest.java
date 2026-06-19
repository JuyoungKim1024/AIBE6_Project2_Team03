package com.backend.domain.notification.controller;

import com.backend.domain.auth.service.JwtTokenProvider;
import com.backend.domain.mypage.entity.MatchRequest;
import com.backend.domain.mypage.entity.MatchRequestStatus;
import com.backend.domain.chat.repository.ChatRoomRepository;
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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.handler;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ActiveProfiles("test")
@SpringBootTest
@Transactional
class NotificationControllerTest {

    @Autowired WebApplicationContext context;
    @Autowired JwtTokenProvider jwtTokenProvider;

    private MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired MyPageMatchRequestRepository matchRequestRepository;
    @Autowired ChatRoomRepository chatRoomRepository;

    private User requester;
    private User editor;
    private MatchRequest matchRequest;
    private String requesterToken;
    private String editorToken;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.webAppContextSetup(context).build();

        requester = new User(SocialProvider.GOOGLE, "google-req-2", "req2@test.com", "유튜버2", null);
        requester.updateRole(UserRole.YOUTUBER);
        userRepository.saveAndFlush(requester);

        editor = new User(SocialProvider.GOOGLE, "google-ed-2", "ed2@test.com", "에디터2", "https://example.com/avatar2.jpg");
        editor.updateRole(UserRole.EDITOR);
        editor.updateMatchingPrice(true, 12000, 12000, MatchPriceUnit.MIN);
        userRepository.saveAndFlush(editor);

        matchRequest = new MatchRequest(requester, editor);
        matchRequestRepository.saveAndFlush(matchRequest);
        matchRequest = matchRequestRepository.findById(matchRequest.getId()).orElseThrow();

        requesterToken = "Bearer " + jwtTokenProvider.createAccessToken(requester.getId());
        editorToken = "Bearer " + jwtTokenProvider.createAccessToken(editor.getId());
    }

    @Test
    @DisplayName("t1 에디터는 자신에게 온 WAITING 상태의 매칭 요청 알림 목록을 조회한다")
    void t1_getNotifications_returnsWaitingRequests() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", editorToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("getNotifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].id").value(matchRequest.getId()))
                .andExpect(jsonPath("$[0].type").value("MATCHING_REQUEST"))
                .andExpect(jsonPath("$[0].status").value("PENDING"))
                .andExpect(jsonPath("$[0].senderName").value(requester.getNickname()))
                .andExpect(jsonPath("$[0].senderAvatar").isEmpty())
                .andExpect(jsonPath("$[0].chatRoomId").doesNotExist());
    }

    @Test
    @DisplayName("t2 유튜버의 알림 목록 조회 시 빈 배열을 반환한다")
    void t2_getNotifications_returnsEmptyForRequester() throws Exception {
        mockMvc.perform(get("/api/notifications")
                        .header("Authorization", requesterToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("getNotifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("t3 에디터가 매칭 요청을 수락하면 채팅방이 생성되고 chatRoomId를 반환한다")
    void t3_accept_createsChatRoomAndReturnsChatRoomId() throws Exception {
        long chatRoomCountBefore = chatRoomRepository.count();

        mockMvc.perform(patch("/api/notifications/{id}/accept", matchRequest.getId())
                        .header("Authorization", editorToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("accept"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(matchRequest.getId()))
                .andExpect(jsonPath("$.type").value("MATCHING_REQUEST"))
                .andExpect(jsonPath("$.status").value("ACCEPTED"))
                .andExpect(jsonPath("$.senderName").value(requester.getNickname()))
                .andExpect(jsonPath("$.chatRoomId").isString());

        MatchRequest updated = matchRequestRepository.findById(matchRequest.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(MatchRequestStatus.ACCEPTED);
        assertThat(chatRoomRepository.count()).isEqualTo(chatRoomCountBefore + 1);
    }

    @Test
    @DisplayName("t4 에디터가 매칭 요청을 거절하면 상태가 REJECTED로 변경된다")
    void t4_reject_changesStatusToRejected() throws Exception {
        mockMvc.perform(patch("/api/notifications/{id}/reject", matchRequest.getId())
                        .header("Authorization", editorToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(matchRequest.getId()))
                .andExpect(jsonPath("$.type").value("MATCHING_REQUEST"))
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.senderName").value(requester.getNickname()))
                .andExpect(jsonPath("$.chatRoomId").doesNotExist());

        MatchRequest updated = matchRequestRepository.findById(matchRequest.getId()).orElseThrow();
        assertThat(updated.getStatus()).isEqualTo(MatchRequestStatus.REJECTED);
    }

    @Test
    @DisplayName("t5 이미 수락된 매칭 요청을 재수락 시 400을 반환한다")
    void t5_accept_returns400WhenAlreadyAccepted() throws Exception {
        matchRequest.accept();
        matchRequestRepository.save(matchRequest);

        mockMvc.perform(patch("/api/notifications/{id}/accept", matchRequest.getId())
                        .header("Authorization", editorToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("accept"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("이미 처리된 요청입니다."));
    }

    @Test
    @DisplayName("t6 다른 에디터의 매칭 요청 수락 시도 시 400을 반환한다")
    void t6_accept_returns400WhenUnauthorizedEditor() throws Exception {
        User otherEditor = new User(SocialProvider.GOOGLE, "google-ed-3", "ed3@test.com", "다른에디터", null);
        otherEditor.updateRole(UserRole.EDITOR);
        userRepository.save(otherEditor);
        String otherEditorToken = "Bearer " + jwtTokenProvider.createAccessToken(otherEditor.getId());

        mockMvc.perform(patch("/api/notifications/{id}/accept", matchRequest.getId())
                        .header("Authorization", otherEditorToken))
                .andDo(print())
                .andExpect(handler().handlerType(NotificationController.class))
                .andExpect(handler().methodName("accept"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("권한이 없습니다."));
    }
}
