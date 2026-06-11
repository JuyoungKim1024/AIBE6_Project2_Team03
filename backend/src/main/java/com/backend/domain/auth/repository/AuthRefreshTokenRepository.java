package com.backend.domain.auth.repository;

import com.backend.domain.auth.entity.AuthRefreshToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthRefreshTokenRepository extends JpaRepository<AuthRefreshToken, String> {
    Optional<AuthRefreshToken> findByRefreshTokenAndRevokedFalse(String refreshToken);
}
