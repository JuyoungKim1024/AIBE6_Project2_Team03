package com.backend.domain.auth.service;

import com.backend.domain.auth.dto.AdminOtpChallengeResponse;
import com.backend.domain.auth.dto.AdminOtpVerifyRequest;
import com.backend.domain.auth.entity.AdminLoginOtp;
import com.backend.domain.auth.repository.AdminLoginOtpRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminLoginService {

    private static final int OTP_VALIDITY_SECONDS = 300;
    private static final int OTP_RESEND_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final AdminLoginOtpRepository otpRepository;
    private final UserRepository userRepository;
    private final VerificationMailService verificationMailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public AdminOtpChallengeResponse requestOtp(User admin) {
        AdminLoginOtp existing = otpRepository.findByUser_Id(admin.getId()).orElse(null);
        if (existing != null && existing.getCreatedAt().isAfter(LocalDateTime.now().minusSeconds(OTP_RESEND_SECONDS))) {
            throw new IllegalStateException("관리자 인증번호는 60초 후 다시 요청할 수 있습니다.");
        }
        if (existing != null) {
            otpRepository.delete(existing);
            otpRepository.flush();
        }

        String code = String.format("%06d", secureRandom.nextInt(1_000_000));
        otpRepository.save(new AdminLoginOtp(
                admin,
                passwordEncoder.encode(code),
                LocalDateTime.now().plusSeconds(OTP_VALIDITY_SECONDS)
        ));
        verificationMailService.sendAdminLoginCode(admin.getProviderEmail(), code);
        return new AdminOtpChallengeResponse(true, OTP_VALIDITY_SECONDS);
    }

    @Transactional
    public User verifyOtp(AdminOtpVerifyRequest request) {
        String email = request.email() == null ? "" : request.email().trim().toLowerCase();
        User admin = userRepository.findByProviderEmailIgnoreCaseAndDeletedAtIsNull(email)
                .orElseThrow(() -> new IllegalArgumentException("관리자 계정을 찾을 수 없습니다."));
        if (!admin.isAdmin()) {
            throw new IllegalArgumentException("관리자 계정이 아닙니다.");
        }

        AdminLoginOtp otp = otpRepository.findByUser_Id(admin.getId())
                .orElseThrow(() -> new IllegalArgumentException("관리자 인증번호를 먼저 요청해주세요."));
        if (otp.getExpiresAt().isBefore(LocalDateTime.now())) {
            otpRepository.delete(otp);
            throw new IllegalArgumentException("관리자 인증번호가 만료되었습니다.");
        }
        if (otp.getAttemptCount() >= MAX_ATTEMPTS) {
            otpRepository.delete(otp);
            throw new IllegalArgumentException("관리자 인증 시도 횟수를 초과했습니다.");
        }

        String code = request.code() == null ? "" : request.code().trim();
        if (!code.matches("^\\d{6}$") || !passwordEncoder.matches(code, otp.getCodeHash())) {
            otp.incrementAttemptCount();
            throw new IllegalArgumentException("관리자 인증번호가 올바르지 않습니다.");
        }

        otpRepository.delete(otp);
        return admin;
    }
}
