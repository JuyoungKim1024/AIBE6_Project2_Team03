package com.backend.domain.auth.repository;

import com.backend.domain.auth.entity.AdminLoginOtp;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminLoginOtpRepository extends JpaRepository<AdminLoginOtp, String> {
    Optional<AdminLoginOtp> findByUser_Id(String userId);

    void deleteByUser_Id(String userId);
}
