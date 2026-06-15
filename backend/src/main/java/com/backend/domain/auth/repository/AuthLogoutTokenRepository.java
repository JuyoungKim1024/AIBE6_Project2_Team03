package com.backend.domain.auth.repository;

import com.backend.domain.auth.entity.AuthLogoutToken;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuthLogoutTokenRepository extends JpaRepository<AuthLogoutToken, String> {
    boolean existsByAccessToken(String accessToken);

    Optional<AuthLogoutToken> findByAccessToken(String accessToken);
}
