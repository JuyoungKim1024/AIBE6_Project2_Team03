package com.backend.domain.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class VerificationMailService {

    private final JavaMailSender mailSender;
    private final String fromAddress;
    private final String smtpUsername;

    public VerificationMailService(
            JavaMailSender mailSender,
            @Value("${app.mail.from:}") String fromAddress,
            @Value("${spring.mail.username:}") String smtpUsername
    ) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
        this.smtpUsername = smtpUsername;
    }

    public void sendSignupCode(String email, String code) {
        if (smtpUsername == null || smtpUsername.isBlank()) {
            throw new IllegalStateException("발신 계정이 설정되지 않았습니다. Spring 실행 환경에 SMTP_USERNAME과 SMTP_PASSWORD를 설정해주세요.");
        }

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress == null || fromAddress.isBlank() ? smtpUsername : fromAddress);
        message.setTo(email);
        message.setSubject("[크크킄] 회원가입 이메일 인증");
        message.setText("인증번호는 " + code + " 입니다.\n5분 안에 입력해주세요.");

        try {
            mailSender.send(message);
        } catch (MailAuthenticationException exception) {
            throw new IllegalStateException("메일 서버 인증에 실패했습니다. SMTP 계정과 앱 비밀번호를 확인해주세요.");
        } catch (MailException exception) {
            throw new IllegalStateException("인증 메일 발송에 실패했습니다. 메일 서버 설정을 확인해주세요.");
        }
    }
}
