package com.backend.domain.auth.service;

import com.backend.domain.auth.dto.AuthResponse;
import com.backend.domain.auth.dto.ProfileUpdateRequest;
import com.backend.domain.auth.dto.SocialUserInfo;
import com.backend.domain.auth.dto.UserResponse;
import com.backend.domain.auth.entity.AuthLogoutToken;
import com.backend.domain.auth.entity.AuthRefreshToken;
import com.backend.domain.auth.repository.AuthLogoutTokenRepository;
import com.backend.domain.auth.repository.AuthRefreshTokenRepository;
import com.backend.domain.user.entity.Profile;
import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;
import com.backend.domain.user.repository.ProfileRepository;
import com.backend.domain.user.repository.UserRepository;
import jakarta.transaction.Transactional;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Base64;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final OAuthClient oAuthClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final AuthRefreshTokenRepository refreshTokenRepository;
    private final AuthLogoutTokenRepository logoutTokenRepository;
    private final long refreshTokenValiditySeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            OAuthClient oAuthClient,
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            AuthRefreshTokenRepository refreshTokenRepository,
            AuthLogoutTokenRepository logoutTokenRepository,
            @Value("${app.jwt.refresh-token-validity-seconds}") long refreshTokenValiditySeconds
    ) {
        this.oAuthClient = oAuthClient;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.logoutTokenRepository = logoutTokenRepository;
        this.refreshTokenValiditySeconds = refreshTokenValiditySeconds;
    }

    public String getAuthorizationUrl(SocialProvider provider) {
        return oAuthClient.getAuthorizationUrl(provider);
    }

    @Transactional
    public AuthResponse login(SocialProvider provider, String code) {
        SocialUserInfo userInfo = oAuthClient.getUserInfo(provider, code);
        User user = userRepository.findByProviderAndSocialId(provider, userInfo.socialId())
                .map(existingUser -> {
                    existingUser.updateSocialProfile(userInfo.email(), userInfo.nickname(), userInfo.profileImage());
                    return existingUser;
                })
                .orElseGet(() -> userRepository.save(new User(
                        provider,
                        userInfo.socialId(),
                        userInfo.email(),
                        createRandomNickname(),
                        userInfo.profileImage()
                )));

        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String refreshToken = createRefreshToken();
        refreshTokenRepository.save(new AuthRefreshToken(
                user,
                refreshToken,
                LocalDateTime.now().plusSeconds(refreshTokenValiditySeconds)
        ));

        return AuthResponse.of(accessToken, refreshToken, user, isOnboardingRequired(user));
    }

    @Transactional
    public UserResponse updateRole(String userId, UserRole role) {
        if (role == null) {
            throw new IllegalArgumentException("역할을 선택해야 합니다");
        }
        User user = getUser(userId);
        user.updateRole(role);
        return toUserResponse(user);
    }

    @Transactional
    public UserResponse updateProfile(String userId, ProfileUpdateRequest request) {
        User user = getUser(userId);
        String name = request.name() == null ? "" : request.name().trim();
        String phone = request.phone() == null ? "" : request.phone().trim();
        String nickname = request.nickname() == null ? "" : request.nickname().trim();

        if (name.isBlank()) {
            throw new IllegalArgumentException("이름을 입력해주세요");
        }
        if (!phone.matches("^01[016789]-?\\d{3,4}-?\\d{4}$")) {
            throw new IllegalArgumentException("올바른 전화번호 형식을 입력해주세요");
        }
        if (nickname.isBlank()) {
            nickname = createRandomNickname(user.getId());
        }
        if (userRepository.existsByNicknameAndIdNot(nickname, user.getId())) {
            throw new IllegalArgumentException("이미 사용중인 닉네임입니다");
        }

        user.updateNickname(nickname);
        user.updateProfileImage(request.profileImage());
        Profile profile = profileRepository.findByUser_Id(userId)
                .orElseGet(() -> profileRepository.save(new Profile(user, name, phone)));
        profile.update(name, phone);
        return UserResponse.from(user, profile.getName(), profile.getPhone());
    }

    @Transactional
    public void logout(String authorizationHeader, String refreshToken) {
        String accessToken = extractAccessToken(authorizationHeader);
        if (!logoutTokenRepository.existsByAccessToken(accessToken)) {
            logoutTokenRepository.save(new AuthLogoutToken(accessToken, jwtTokenProvider.getExpiration(accessToken)));
        }

        if (refreshToken != null && !refreshToken.isBlank()) {
            refreshTokenRepository.findByRefreshTokenAndRevokedFalse(refreshToken)
                    .ifPresent(AuthRefreshToken::revoke);
        }
    }

    @Transactional
    public void deleteAccount(String userId, String confirmation) {
        if (!"탈퇴하겠습니다".equals(confirmation)) {
            throw new IllegalArgumentException("탈퇴 문구를 정확히 입력해주세요");
        }
        userRepository.delete(getUser(userId));
    }

    public UserResponse getMe(String userId) {
        return toUserResponse(getUser(userId));
    }

    public String resolveUserId(String authorizationHeader) {
        String accessToken = extractAccessToken(authorizationHeader);
        if (logoutTokenRepository.existsByAccessToken(accessToken)) {
            throw new IllegalArgumentException("로그아웃된 토큰입니다");
        }
        return jwtTokenProvider.getUserId(accessToken);
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private UserResponse toUserResponse(User user) {
        return profileRepository.findByUser_Id(user.getId())
                .map(profile -> UserResponse.from(user, profile.getName(), profile.getPhone()))
                .orElseGet(() -> UserResponse.from(user));
    }

    private boolean isOnboardingRequired(User user) {
        if (user.getRole() == null) {
            return true;
        }
        return profileRepository.findByUser_Id(user.getId())
                .map(profile -> profile.getName() == null || profile.getName().isBlank()
                        || profile.getPhone() == null || profile.getPhone().isBlank())
                .orElse(true);
    }

    private String extractAccessToken(String authorizationHeader) {
        if (authorizationHeader == null || !authorizationHeader.startsWith("Bearer ")) {
            throw new IllegalArgumentException("인증 토큰이 필요합니다");
        }
        return authorizationHeader.substring(7);
    }

    private String createRefreshToken() {
        byte[] bytes = new byte[48];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String createRandomNickname(String userId) {
        for (int i = 0; i < 10; i++) {
            String nickname = "크크킄" + (100000 + secureRandom.nextInt(900000));
            if (!userRepository.existsByNicknameAndIdNot(nickname, userId)) {
                return nickname;
            }
        }
        return "크크킄" + System.currentTimeMillis();
    }

    private String createRandomNickname() {
        for (int i = 0; i < 10; i++) {
            String nickname = "크크킄" + (100000 + secureRandom.nextInt(900000));
            if (!userRepository.existsByNickname(nickname)) {
                return nickname;
            }
        }
        return "크크킄" + System.currentTimeMillis();
    }
}
