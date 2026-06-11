package com.backend.domain.auth.controller;

import com.backend.domain.auth.dto.AuthResponse;
import com.backend.domain.auth.dto.UserResponse;
import com.backend.domain.auth.service.AuthService;
import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AuthControllerTest {

    private AuthService authService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        authService = mock(AuthService.class);
        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(authService, "http://localhost:3000"))
                .build();
    }

    @Test
    @DisplayName("t1 구글 로그인 시작 시 구글 OAuth 인가 URL로 리다이렉트한다")
    void t1_googleLoginRedirectsToProviderAuthorizationUrl() throws Exception {
        when(authService.getAuthorizationUrl(SocialProvider.GOOGLE))
                .thenReturn("https://accounts.google.com/o/oauth2/v2/auth?client_id=test");

        mockMvc.perform(get("/api/auth/google/login"))
                .andExpect(status().isFound())
                .andExpect(header().string("Location", "https://accounts.google.com/o/oauth2/v2/auth?client_id=test"));
    }

    @Test
    @DisplayName("t2 카카오 콜백 성공 시 토큰과 온보딩 여부를 담아 프론트 콜백으로 리다이렉트한다")
    void t2_kakaoCallbackRedirectsToFrontendCallbackWithTokens() throws Exception {
        UserResponse user = new UserResponse(
                "user-id",
                SocialProvider.KAKAO,
                "kakao@example.com",
                "kakao-user",
                "https://example.com/profile.png",
                null,
                true
        );
        when(authService.login(SocialProvider.KAKAO, "auth-code"))
                .thenReturn(new AuthResponse("access-token", "refresh-token", true, user));

        mockMvc.perform(get("/api/auth/kakao/callback").param("code", "auth-code"))
                .andExpect(status().isFound())
                .andExpect(header().string(
                        "Location",
                        "http://localhost:3000/login/callback?accessToken=access-token&refreshToken=refresh-token&onboardingRequired=true"
                ));
    }

    @Test
    @DisplayName("t3 인증 토큰으로 내 회원 정보를 조회한다")
    void t3_meReturnsAuthenticatedUser() throws Exception {
        when(authService.resolveUserId("Bearer access-token")).thenReturn("user-id");
        when(authService.getMe("user-id")).thenReturn(new UserResponse(
                "user-id",
                SocialProvider.GOOGLE,
                "google@example.com",
                "google-user",
                null,
                UserRole.YOUTUBER,
                false
        ));

        mockMvc.perform(get("/api/auth/me").header("Authorization", "Bearer access-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-id"))
                .andExpect(jsonPath("$.provider").value("GOOGLE"))
                .andExpect(jsonPath("$.role").value("YOUTUBER"))
                .andExpect(jsonPath("$.onboardingRequired").value(false));
    }

    @Test
    @DisplayName("t4 인증된 사용자의 온보딩 역할을 저장한다")
    void t4_updateRoleStoresAuthenticatedUserRole() throws Exception {
        when(authService.resolveUserId("Bearer access-token")).thenReturn("user-id");
        when(authService.updateRole(eq("user-id"), eq(UserRole.EDITOR))).thenReturn(new UserResponse(
                "user-id",
                SocialProvider.GOOGLE,
                "google@example.com",
                "google-user",
                null,
                UserRole.EDITOR,
                false
        ));

        mockMvc.perform(patch("/api/users/me/role")
                        .header("Authorization", "Bearer access-token")
                        .contentType("application/json")
                        .content("{\"role\":\"EDITOR\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("user-id"))
                .andExpect(jsonPath("$.role").value("EDITOR"))
                .andExpect(jsonPath("$.onboardingRequired").value(false));
    }

    @Test
    @DisplayName("t5 로그아웃 시 access token과 refresh token을 서버에서 만료 처리한다")
    void t5_logoutRevokesTokens() throws Exception {
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer access-token")
                        .contentType("application/json")
                        .content("{\"refreshToken\":\"refresh-token\"}"))
                .andExpect(status().isNoContent());

        verify(authService).logout("Bearer access-token", "refresh-token");
    }
}
