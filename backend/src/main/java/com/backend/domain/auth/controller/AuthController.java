package com.backend.domain.auth.controller;

import com.backend.domain.auth.dto.AuthResponse;
import com.backend.domain.auth.dto.DeleteAccountRequest;
import com.backend.domain.auth.dto.EmailVerificationRequest;
import com.backend.domain.auth.dto.EmailVerificationResponse;
import com.backend.domain.auth.dto.EmailVerificationCompleteResponse;
import com.backend.domain.auth.dto.EmailVerificationSendRequest;
import com.backend.domain.auth.dto.LocalLoginRequest;
import com.backend.domain.auth.dto.LocalSignupRequest;
import com.backend.domain.auth.dto.PasswordChangeRequest;
import com.backend.domain.auth.dto.ProfileUpdateRequest;
import com.backend.domain.auth.dto.RoleUpdateRequest;
import com.backend.domain.auth.dto.UserResponse;
import com.backend.domain.auth.service.AuthService;
import com.backend.global.exception.SuspendedAccountException;
import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.UserRole;
import java.net.URI;
import java.time.Duration;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;

@RestController
@RequestMapping("/api")
public class AuthController {

    private final AuthService authService;
    private final String frontendUrl;
    private final boolean secureCookie;
    private final String cookieSameSite;
    private final long refreshTokenValiditySeconds;

    public AuthController(
            AuthService authService,
            @Value("${app.frontend-url}") String frontendUrl,
            @Value("${app.cookie.secure:false}") boolean secureCookie,
            @Value("${app.cookie.same-site:Lax}") String cookieSameSite,
            @Value("${app.jwt.refresh-token-validity-seconds}") long refreshTokenValiditySeconds
    ) {
        this.authService = authService;
        this.frontendUrl = frontendUrl;
        this.secureCookie = secureCookie;
        this.cookieSameSite = cookieSameSite;
        this.refreshTokenValiditySeconds = refreshTokenValiditySeconds;
    }

    @GetMapping("/auth/{provider}/login")
    public ResponseEntity<Void> redirectToProvider(@PathVariable String provider) {
        SocialProvider socialProvider = SocialProvider.valueOf(provider.toUpperCase());
        return ResponseEntity.status(302)
                .location(URI.create(authService.getAuthorizationUrl(socialProvider)))
                .build();
    }

    @GetMapping("/auth/{provider}/callback")
    public ResponseEntity<Void> callback(@PathVariable String provider, @RequestParam String code) {
        SocialProvider socialProvider = SocialProvider.valueOf(provider.toUpperCase());
        AuthResponse response;
        try {
            response = authService.login(socialProvider, code);
        } catch (SuspendedAccountException exception) {
            URI errorRedirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/login")
                    .queryParam("errorCode", "ACCOUNT_SUSPENDED")
                    .queryParam("reason", exception.getReason())
                    .queryParam("suspendedUntil", exception.getSuspendedUntil())
                    .queryParam("remainingMinutes", exception.getRemainingMinutes())
                    .build()
                    .encode()
                    .toUri();
            return ResponseEntity.status(302).location(errorRedirectUri).build();
        } catch (IllegalArgumentException exception) {
            URI errorRedirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                    .path("/login")
                    .queryParam("error", exception.getMessage())
                    .build()
                    .encode()
                    .toUri();
            return ResponseEntity.status(302).location(errorRedirectUri).build();
        }
        URI redirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/login/callback")
                .queryParam("onboardingRequired", response.onboardingRequired())
                .build()
                .toUri();

        return ResponseEntity.status(302)
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie(response.refreshToken()).toString())
                .location(redirectUri)
                .build();
    }

    @PostMapping("/auth/local/signup/request")
    public EmailVerificationResponse requestLocalSignup(@RequestBody EmailVerificationSendRequest request) {
        return authService.requestLocalSignup(request);
    }

    @PostMapping("/auth/local/signup/verify")
    public EmailVerificationCompleteResponse verifyLocalSignup(@RequestBody EmailVerificationRequest request) {
        return authService.verifyLocalSignup(request);
    }

    @PostMapping("/auth/local/signup/complete")
    public ResponseEntity<AuthResponse> completeLocalSignup(@RequestBody LocalSignupRequest request) {
        AuthResponse response = authService.completeLocalSignup(request);
        return withRefreshCookie(response);
    }

    @PostMapping("/auth/local/login")
    public ResponseEntity<AuthResponse> localLogin(@RequestBody LocalLoginRequest request) {
        AuthResponse response = authService.localLogin(request);
        return withRefreshCookie(response);
    }

    @PostMapping("/auth/test-login/{role}")
    public ResponseEntity<AuthResponse> testLogin(@PathVariable UserRole role) {
        return withRefreshCookie(authService.testLogin(role));
    }

    @PostMapping("/auth/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.noContent().build();
        }
        AuthResponse response = authService.refresh(refreshToken);
        return withRefreshCookie(response);
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader("Authorization") String authorizationHeader,
            @CookieValue(name = "refreshToken", required = false) String refreshToken
    ) {
        authService.logout(authorizationHeader, refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshTokenCookie().toString())
                .build();
    }

    @GetMapping("/auth/me")
    public UserResponse me(@RequestHeader("Authorization") String authorizationHeader) {
        return authService.getMe(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/users/me/role")
    public UserResponse updateRole(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody RoleUpdateRequest request
    ) {
        return authService.updateRole(authService.resolveUserId(authorizationHeader), request.role());
    }

    @PatchMapping("/users/me/terms")
    public UserResponse agreeToTerms(
            @RequestHeader("Authorization") String authorizationHeader
    ) {
        return authService.agreeToTerms(authService.resolveUserId(authorizationHeader));
    }

    @PatchMapping("/users/me/profile")
    public UserResponse updateProfile(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfile(authService.resolveUserId(authorizationHeader), request);
    }

    @PatchMapping("/users/me/password")
    public ResponseEntity<Void> changePassword(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody PasswordChangeRequest request
    ) {
        authService.changePassword(authService.resolveUserId(authorizationHeader), request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/me")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody DeleteAccountRequest request
    ) {
        authService.deleteAccount(authService.resolveUserId(authorizationHeader), request.confirmation());
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, clearRefreshTokenCookie().toString())
                .build();
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(AuthResponse response) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie(response.refreshToken()).toString())
                .body(response);
    }

    private ResponseCookie refreshTokenCookie(String refreshToken) {
        return ResponseCookie.from("refreshToken", refreshToken)
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(cookieSameSite)
                .path("/api/auth")
                .maxAge(Duration.ofSeconds(refreshTokenValiditySeconds))
                .build();
    }

    private ResponseCookie clearRefreshTokenCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(secureCookie)
                .sameSite(cookieSameSite)
                .path("/api/auth")
                .maxAge(Duration.ZERO)
                .build();
    }
}
