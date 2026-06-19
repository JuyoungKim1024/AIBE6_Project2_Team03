package com.backend.domain.auth.repository;

import com.backend.domain.auth.entity.EmailVerification;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface EmailVerificationRepository extends JpaRepository<EmailVerification, String> {
    Optional<EmailVerification> findByEmailIgnoreCase(String email);

    void deleteByEmailIgnoreCase(String email);
}
