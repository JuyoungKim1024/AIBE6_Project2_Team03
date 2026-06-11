package com.backend.domain.auth.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtTokenProvider {

    private final String secret;
    private final long accessTokenValiditySeconds;
    private final ObjectMapper objectMapper;

    public JwtTokenProvider(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.access-token-validity-seconds}") long accessTokenValiditySeconds,
            ObjectMapper objectMapper
    ) {
        this.secret = secret;
        this.accessTokenValiditySeconds = accessTokenValiditySeconds;
        this.objectMapper = objectMapper;
    }

    public String createAccessToken(String userId) {
        long now = Instant.now().getEpochSecond();
        Map<String, Object> header = Map.of("alg", "HS256", "typ", "JWT");
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("sub", userId);
        payload.put("iat", now);
        payload.put("exp", now + accessTokenValiditySeconds);

        String unsignedToken = base64Json(header) + "." + base64Json(payload);
        return unsignedToken + "." + sign(unsignedToken);
    }

    public String getUserId(String token) {
        try {
            return (String) parsePayload(token).get("sub");
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token", e);
        }
    }

    public LocalDateTime getExpiration(String token) {
        try {
            Number exp = (Number) parsePayload(token).get("exp");
            return LocalDateTime.ofInstant(Instant.ofEpochSecond(exp.longValue()), ZoneId.systemDefault());
        } catch (Exception e) {
            throw new IllegalArgumentException("Invalid token", e);
        }
    }

    private Map<String, Object> parsePayload(String token) throws Exception {
        String[] parts = token.split("\\.");
        if (parts.length != 3 || !sign(parts[0] + "." + parts[1]).equals(parts[2])) {
            throw new IllegalArgumentException("Invalid token");
        }

        byte[] payloadBytes = Base64.getUrlDecoder().decode(parts[1]);
        Map<String, Object> payload = objectMapper.readValue(payloadBytes, new TypeReference<>() {});
        Number exp = (Number) payload.get("exp");
        if (exp == null || exp.longValue() < Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("Expired token");
        }
        return payload;
    }

    private String base64Json(Map<String, Object> value) {
        try {
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(objectMapper.writeValueAsBytes(value));
        } catch (Exception e) {
            throw new IllegalStateException("JWT 생성에 실패했습니다.", e);
        }
    }

    private String sign(String value) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getUrlEncoder()
                    .withoutPadding()
                    .encodeToString(mac.doFinal(value.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("JWT 서명에 실패했습니다.", e);
        }
    }
}
