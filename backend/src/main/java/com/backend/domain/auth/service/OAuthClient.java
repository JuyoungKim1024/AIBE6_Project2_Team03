package com.backend.domain.auth.service;

import com.backend.domain.auth.dto.SocialUserInfo;
import com.backend.domain.user.entity.SocialProvider;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;

@Component
public class OAuthClient {

    private final RestClient restClient;
    private final String googleClientId;
    private final String googleClientSecret;
    private final String googleRedirectUri;
    private final String kakaoClientId;
    private final String kakaoClientSecret;
    private final String kakaoRedirectUri;

    public OAuthClient(
            RestClient.Builder restClientBuilder,
            @Value("${oauth.google.client-id}") String googleClientId,
            @Value("${oauth.google.client-secret}") String googleClientSecret,
            @Value("${oauth.google.redirect-uri}") String googleRedirectUri,
            @Value("${oauth.kakao.client-id}") String kakaoClientId,
            @Value("${oauth.kakao.client-secret:}") String kakaoClientSecret,
            @Value("${oauth.kakao.redirect-uri}") String kakaoRedirectUri
    ) {
        this.restClient = restClientBuilder.build();
        this.googleClientId = googleClientId;
        this.googleClientSecret = googleClientSecret;
        this.googleRedirectUri = googleRedirectUri;
        this.kakaoClientId = kakaoClientId;
        this.kakaoClientSecret = kakaoClientSecret;
        this.kakaoRedirectUri = kakaoRedirectUri;
    }

    public String getAuthorizationUrl(SocialProvider provider) {
        if (provider == SocialProvider.GOOGLE) {
            return "https://accounts.google.com/o/oauth2/v2/auth"
                    + "?client_id=" + encode(googleClientId)
                    + "&redirect_uri=" + encode(googleRedirectUri)
                    + "&response_type=code"
                    + "&scope=" + encode("openid email profile");
        }

        return "https://kauth.kakao.com/oauth/authorize"
                + "?client_id=" + encode(kakaoClientId)
                + "&redirect_uri=" + encode(kakaoRedirectUri)
                + "&response_type=code";
    }

    public SocialUserInfo getUserInfo(SocialProvider provider, String code) {
        return switch (provider) {
            case GOOGLE -> getGoogleUserInfo(code);
            case KAKAO -> getKakaoUserInfo(code);
        };
    }

    private SocialUserInfo getGoogleUserInfo(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", googleClientId);
        body.add("client_secret", googleClientSecret);
        body.add("redirect_uri", googleRedirectUri);
        body.add("code", code);

        Map<String, Object> token = postForm("https://oauth2.googleapis.com/token", body);
        String accessToken = (String) token.get("access_token");
        Map<String, Object> profile = getWithBearer("https://www.googleapis.com/oauth2/v2/userinfo", accessToken);

        return new SocialUserInfo(
                SocialProvider.GOOGLE,
                (String) profile.get("id"),
                (String) profile.get("email"),
                (String) profile.getOrDefault("name", "Google User"),
                (String) profile.get("picture")
        );
    }

    @SuppressWarnings("unchecked")
    private SocialUserInfo getKakaoUserInfo(String code) {
        MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
        body.add("grant_type", "authorization_code");
        body.add("client_id", kakaoClientId);
        if (kakaoClientSecret != null && !kakaoClientSecret.isBlank()) {
            body.add("client_secret", kakaoClientSecret);
        }
        body.add("redirect_uri", kakaoRedirectUri);
        body.add("code", code);

        Map<String, Object> token = postForm("https://kauth.kakao.com/oauth/token", body);
        String accessToken = (String) token.get("access_token");
        Map<String, Object> profile = getWithBearer("https://kapi.kakao.com/v2/user/me", accessToken);
        Map<String, Object> kakaoAccount = (Map<String, Object>) profile.getOrDefault("kakao_account", Map.of());
        Map<String, Object> properties = (Map<String, Object>) profile.getOrDefault("properties", Map.of());
        Map<String, Object> profileInfo = (Map<String, Object>) kakaoAccount.getOrDefault("profile", Map.of());

        return new SocialUserInfo(
                SocialProvider.KAKAO,
                String.valueOf(profile.get("id")),
                (String) kakaoAccount.get("email"),
                (String) properties.getOrDefault("nickname", "Kakao User"),
                (String) profileInfo.get("profile_image_url")
        );
    }

    private Map<String, Object> postForm(String url, MultiValueMap<String, String> body) {
        return restClient.post()
                .uri(url)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(body)
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    private Map<String, Object> getWithBearer(String url, String accessToken) {
        return restClient.get()
                .uri(url)
                .headers(headers -> headers.setBearerAuth(accessToken))
                .retrieve()
                .body(new ParameterizedTypeReference<>() {});
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
