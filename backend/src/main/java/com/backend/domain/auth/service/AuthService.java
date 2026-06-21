package com.backend.domain.auth.service;

import com.backend.domain.auth.dto.AuthResponse;
import com.backend.domain.auth.dto.EmailVerificationRequest;
import com.backend.domain.auth.dto.EmailVerificationResponse;
import com.backend.domain.auth.dto.EmailVerificationCompleteResponse;
import com.backend.domain.auth.dto.EmailVerificationSendRequest;
import com.backend.domain.auth.dto.LocalLoginRequest;
import com.backend.domain.auth.dto.LocalSignupRequest;
import com.backend.domain.auth.dto.PasswordChangeRequest;
import com.backend.domain.auth.dto.ProfileUpdateRequest;
import com.backend.domain.auth.dto.SocialUserInfo;
import com.backend.domain.auth.dto.UserResponse;
import com.backend.domain.auth.entity.AuthLogoutToken;
import com.backend.domain.auth.entity.AuthRefreshToken;
import com.backend.domain.auth.entity.EmailVerification;
import com.backend.domain.auth.repository.AuthLogoutTokenRepository;
import com.backend.domain.auth.repository.AuthRefreshTokenRepository;
import com.backend.domain.auth.repository.EmailVerificationRepository;
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
import java.util.Locale;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final int EMAIL_VERIFICATION_SECONDS = 300;
    private static final Pattern EMAIL_PATTERN = Pattern.compile("^[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}$", Pattern.CASE_INSENSITIVE);
    private static final Pattern PASSWORD_PATTERN = Pattern.compile("^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,64}$");

    private final OAuthClient oAuthClient;
    private final JwtTokenProvider jwtTokenProvider;
    private final UserRepository userRepository;
    private final ProfileRepository profileRepository;
    private final AuthRefreshTokenRepository refreshTokenRepository;
    private final AuthLogoutTokenRepository logoutTokenRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final VerificationMailService verificationMailService;
    private final PasswordEncoder passwordEncoder;
    private final long refreshTokenValiditySeconds;
    private final SecureRandom secureRandom = new SecureRandom();

    public AuthService(
            OAuthClient oAuthClient,
            JwtTokenProvider jwtTokenProvider,
            UserRepository userRepository,
            ProfileRepository profileRepository,
            AuthRefreshTokenRepository refreshTokenRepository,
            AuthLogoutTokenRepository logoutTokenRepository,
            EmailVerificationRepository emailVerificationRepository,
            VerificationMailService verificationMailService,
            PasswordEncoder passwordEncoder,
            @Value("${app.jwt.refresh-token-validity-seconds}") long refreshTokenValiditySeconds
    ) {
        this.oAuthClient = oAuthClient;
        this.jwtTokenProvider = jwtTokenProvider;
        this.userRepository = userRepository;
        this.profileRepository = profileRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.logoutTokenRepository = logoutTokenRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.verificationMailService = verificationMailService;
        this.passwordEncoder = passwordEncoder;
        this.refreshTokenValiditySeconds = refreshTokenValiditySeconds;
    }

    public String getAuthorizationUrl(SocialProvider provider) {
        return oAuthClient.getAuthorizationUrl(provider);
    }

    @Transactional
    public AuthResponse login(SocialProvider provider, String code) {
        SocialUserInfo userInfo = oAuthClient.getUserInfo(provider, code);
        User user = userRepository.findByProviderAndSocialIdAndDeletedAtIsNull(provider, userInfo.socialId())
                .map(existingUser -> {
                    existingUser.updateSocialProfile(userInfo.email(), userInfo.nickname(), userInfo.profileImage());
                    return existingUser;
                })
                .orElseGet(() -> {
                    String normalizedEmail = normalizeEmail(userInfo.email());
                    String email = normalizedEmail.isBlank() ? null : normalizedEmail;
                    if (email != null && userRepository.existsByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)) {
                        throw new IllegalArgumentException("이미 가입된 이메일입니다.");
                    }
                    return userRepository.save(new User(
                            provider,
                            userInfo.socialId(),
                            email,
                            createRandomNickname(),
                            userInfo.profileImage()
                    ));
                });

        return issueTokens(user);
    }

    @Transactional
    public EmailVerificationResponse requestLocalSignup(EmailVerificationSendRequest request) {
        String email = normalizeAndValidateEmail(request.email());
        if (userRepository.existsByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        emailVerificationRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            if (existing.getExpiresAt().isAfter(LocalDateTime.now().plusSeconds(240))) {
                throw new IllegalArgumentException("인증 메일은 60초 후 다시 요청할 수 있습니다.");
            }
        });
        emailVerificationRepository.deleteByEmailIgnoreCase(email);
        emailVerificationRepository.flush();

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        emailVerificationRepository.save(new EmailVerification(
                email,
                passwordEncoder.encode(code),
                LocalDateTime.now().plusSeconds(EMAIL_VERIFICATION_SECONDS)
        ));
        verificationMailService.sendSignupCode(email, code);
        return new EmailVerificationResponse(EMAIL_VERIFICATION_SECONDS);
    }

    public EmailVerificationCompleteResponse verifyLocalSignup(EmailVerificationRequest request) {
        String email = normalizeAndValidateEmail(request.email());
        String code = request.code() == null ? "" : request.code().trim();
        EmailVerification verification = emailVerificationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 인증 요청을 먼저 진행해주세요."));

        if (verification.getExpiresAt().isBefore(LocalDateTime.now())) {
            emailVerificationRepository.delete(verification);
            throw new IllegalArgumentException("인증번호가 만료되었습니다. 다시 요청해주세요.");
        }
        if (verification.getAttemptCount() >= 5) {
            emailVerificationRepository.delete(verification);
            throw new IllegalArgumentException("인증 시도 횟수를 초과했습니다. 다시 요청해주세요.");
        }
        if (!code.matches("^\\d{6}$") || !passwordEncoder.matches(code, verification.getCodeHash())) {
            verification.incrementAttemptCount();
            emailVerificationRepository.save(verification);
            throw new IllegalArgumentException("인증번호가 올바르지 않습니다.");
        }
        String verificationToken = createRefreshToken();
        verification.completeVerification(passwordEncoder.encode(verificationToken));
        emailVerificationRepository.save(verification);
        return new EmailVerificationCompleteResponse(verificationToken);
    }

    @Transactional
    public AuthResponse completeLocalSignup(LocalSignupRequest request) {
        String email = normalizeAndValidateEmail(request.email());
        validatePassword(request.password());
        if (request.verificationToken() == null || request.verificationToken().isBlank()) {
            throw new IllegalArgumentException("이메일 인증을 완료해주세요.");
        }
        if (userRepository.existsByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)) {
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");
        }

        EmailVerification verification = emailVerificationRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 인증을 완료해주세요."));
        if (verification.getVerifiedAt() == null || verification.getSignupTokenHash() == null
                || verification.getVerifiedAt().isBefore(LocalDateTime.now().minusMinutes(10))
                || !passwordEncoder.matches(request.verificationToken(), verification.getSignupTokenHash())) {
            throw new IllegalArgumentException("이메일 인증 정보가 만료되었습니다. 다시 인증해주세요.");
        }

        User user = userRepository.save(new User(email, passwordEncoder.encode(request.password()), createRandomNickname()));
        emailVerificationRepository.delete(verification);
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse localLogin(LocalLoginRequest request) {
        String email = normalizeAndValidateEmail(request.email());
        if (request.password() == null || request.password().isBlank()) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        User user = userRepository.findByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (user.getProvider() != SocialProvider.LOCAL) {
            throw new IllegalArgumentException("소셜 로그인으로 가입된 이메일입니다.");
        }
        if (!user.isEmailVerified() || user.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("이메일 또는 비밀번호가 올바르지 않습니다.");
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResponse refresh(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new IllegalArgumentException("리프레시 토큰이 필요합니다.");
        }
        AuthRefreshToken storedToken = refreshTokenRepository.findByRefreshTokenAndRevokedFalse(refreshToken)
                .orElseThrow(() -> new IllegalArgumentException("유효하지 않은 리프레시 토큰입니다."));
        if (storedToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            storedToken.revoke();
            throw new IllegalArgumentException("리프레시 토큰이 만료되었습니다.");
        }
        if (storedToken.getUser().isDeleted()) {
            storedToken.revoke();
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }
        storedToken.revoke();
        return issueTokens(storedToken.getUser());
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
    public UserResponse agreeToTerms(String userId) {
        User user = getUser(userId);
        user.agreeToTerms();
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
    public void changePassword(String userId, PasswordChangeRequest request) {
        User user = getUser(userId);
        if (user.getProvider() != SocialProvider.LOCAL || user.getPasswordHash() == null) {
            throw new IllegalArgumentException("소셜 로그인 계정은 비밀번호를 변경할 수 없습니다.");
        }
        if (request.currentPassword() == null
                || !passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호가 일치하지 않습니다.");
        }
        validatePassword(request.newPassword());
        if (passwordEncoder.matches(request.newPassword(), user.getPasswordHash())) {
            throw new IllegalArgumentException("현재 비밀번호와 다른 비밀번호를 입력해주세요.");
        }
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
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
        User user = getUser(userId);
        if (user.isAdmin()) {
            throw new IllegalArgumentException("관리자 계정은 탈퇴할 수 없습니다.");
        }
        profileRepository.findByUser_Id(userId).ifPresent(Profile::withdraw);
        user.withdraw();
    }

    public UserResponse getMe(String userId) {
        return toUserResponse(getUser(userId));
    }

    public String resolveUserId(String authorizationHeader) {
        String accessToken = extractAccessToken(authorizationHeader);
        if (logoutTokenRepository.existsByAccessToken(accessToken)) {
            throw new IllegalArgumentException("로그아웃된 토큰입니다");
        }
        String userId = jwtTokenProvider.getUserId(accessToken);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (user.isDeleted()) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }
        return userId;
    }

    private User getUser(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (user.isDeleted()) {
            throw new IllegalArgumentException("탈퇴한 계정입니다.");
        }
        return user;
    }

    private UserResponse toUserResponse(User user) {
        return profileRepository.findByUser_Id(user.getId())
                .map(profile -> UserResponse.from(user, profile.getName(), profile.getPhone()))
                .orElseGet(() -> UserResponse.from(user));
    }

    private boolean isOnboardingRequired(User user) {
        if (user.isAdmin()) {
            return false;
        }
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

    private AuthResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId());
        String refreshToken = createRefreshToken();
        refreshTokenRepository.save(new AuthRefreshToken(
                user,
                refreshToken,
                LocalDateTime.now().plusSeconds(refreshTokenValiditySeconds)
        ));
        return AuthResponse.of(accessToken, refreshToken, user, isOnboardingRequired(user));
    }

    private String normalizeAndValidateEmail(String email) {
        String normalized = normalizeEmail(email);
        if (!EMAIL_PATTERN.matcher(normalized).matches()) {
            throw new IllegalArgumentException("올바른 이메일 형식을 입력해주세요.");
        }
        return normalized;
    }

    private String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePassword(String password) {
        if (password == null || !PASSWORD_PATTERN.matcher(password).matches()) {
            throw new IllegalArgumentException("비밀번호는 영문 대문자, 소문자, 숫자를 포함한 8자 이상이어야 합니다.");
        }
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
