package com.backend.domain.auth.controller;

import com.backend.domain.auth.dto.AuthResponse;
import com.backend.domain.auth.dto.DeleteAccountRequest;
import com.backend.domain.auth.dto.LogoutRequest;
import com.backend.domain.auth.dto.ProfileUpdateRequest;
import com.backend.domain.auth.dto.RoleUpdateRequest;
import com.backend.domain.auth.dto.UserResponse;
import com.backend.domain.auth.service.AuthService;
import com.backend.domain.user.entity.SocialProvider;
import java.net.URI;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
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

    public AuthController(AuthService authService, @Value("${app.frontend-url}") String frontendUrl) {
        this.authService = authService;
        this.frontendUrl = frontendUrl;
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
        AuthResponse response = authService.login(socialProvider, code);
        URI redirectUri = UriComponentsBuilder.fromUriString(frontendUrl)
                .path("/login/callback")
                .queryParam("accessToken", response.accessToken())
                .queryParam("refreshToken", response.refreshToken())
                .queryParam("onboardingRequired", response.onboardingRequired())
                .build()
                .toUri();

        return ResponseEntity.status(302).location(redirectUri).build();
    }

    @PostMapping("/auth/logout")
    public ResponseEntity<Void> logout(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody(required = false) LogoutRequest request
    ) {
        authService.logout(authorizationHeader, request == null ? null : request.refreshToken());
        return ResponseEntity.noContent().build();
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

    @PatchMapping("/users/me/profile")
    public UserResponse updateProfile(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody ProfileUpdateRequest request
    ) {
        return authService.updateProfile(authService.resolveUserId(authorizationHeader), request);
    }

    @DeleteMapping("/users/me")
    public ResponseEntity<Void> deleteAccount(
            @RequestHeader("Authorization") String authorizationHeader,
            @RequestBody DeleteAccountRequest request
    ) {
        authService.deleteAccount(authService.resolveUserId(authorizationHeader), request.confirmation());
        return ResponseEntity.noContent().build();
    }
}
