package com.backend.domain.auth.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.io.UnsupportedEncodingException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailAuthenticationException;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ClassPathResource;
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

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(
                    fromAddress == null || fromAddress.isBlank() ? smtpUsername : fromAddress,
                    "크크킄"
            );
            helper.setTo(email);
            helper.setSubject("[크크킄] 회원가입 이메일 인증");
            helper.setText(createSignupVerificationHtml(code), true);
            helper.addInline(
                    "brandVideoLogo",
                    new ClassPathResource("mail/video-logo.png"),
                    "image/png"
            );
            mailSender.send(message);
        } catch (MailAuthenticationException exception) {
            throw new IllegalStateException("메일 서버 인증에 실패했습니다. SMTP 계정과 앱 비밀번호를 확인해주세요.");
        } catch (UnsupportedEncodingException exception) {
            throw new IllegalStateException("메일 발신자 이름을 설정하지 못했습니다.");
        } catch (MessagingException exception) {
            throw new IllegalStateException("인증 메일을 생성하지 못했습니다.");
        } catch (MailException exception) {
            throw new IllegalStateException("인증 메일 발송에 실패했습니다. 메일 서버 설정을 확인해주세요.");
        }
    }

    private String createSignupVerificationHtml(String code) {
        return """
                <!doctype html>
                <html lang="ko">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width,initial-scale=1">
                  <style>
                    @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/static/pretendard.css');
                  </style>
                </head>
                <body style="margin:0;padding:0;background:#F3F4F6;font-family:Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',Arial,sans-serif;color:#111827;">
                  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background:#F3F4F6;">
                    <tr>
                      <td align="center" style="padding:40px 16px;">
                        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden;">
                          <tr>
                            <td style="height:6px;background:#3B82F6;font-size:0;line-height:0;">&nbsp;</td>
                          </tr>
                          <tr>
                            <td style="padding:36px 40px 32px;">
                              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin-bottom:28px;">
                                <tr>
                                  <td width="48" height="48" align="center" valign="middle" style="width:48px;height:48px;background:#EFF6FF;border-radius:12px;">
                                    <img src="cid:brandVideoLogo" width="32" height="32" alt="" style="display:block;width:32px;height:32px;border:0;">
                                  </td>
                                  <td style="padding-left:12px;font-family:Pretendard,-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Noto Sans KR',Arial,sans-serif;font-size:26px;line-height:1;font-weight:800;color:#111827;letter-spacing:0;">
                                    크크<span style="color:#3B82F6;">킄</span>
                                  </td>
                                </tr>
                              </table>
                              <h1 style="margin:0 0 12px;font-size:22px;line-height:1.4;color:#111827;">이메일 인증번호를 확인해주세요</h1>
                              <p style="margin:0 0 28px;font-size:15px;line-height:1.7;color:#6B7280;">
                                회원가입을 계속하려면 아래 인증번호를 인증 화면에 입력해주세요.
                              </p>
                              <div style="padding:24px;text-align:center;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:10px;">
                                <div style="margin-bottom:10px;font-size:12px;font-weight:700;color:#3B82F6;">인증번호</div>
                                <div style="font-size:34px;line-height:1;font-weight:800;color:#1D4ED8;letter-spacing:8px;">%s</div>
                              </div>
                              <div style="margin-top:24px;padding:16px 18px;background:#FFF7F7;border-left:4px solid #FF6B6B;border-radius:6px;">
                                <p style="margin:0;font-size:13px;line-height:1.6;color:#4B5563;">
                                  인증번호는 <strong style="color:#DC2626;">5분 동안</strong> 유효합니다.<br>
                                  본인이 요청하지 않았다면 이 메일을 무시해주세요.
                                </p>
                              </div>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:20px 40px;background:#F9FAFB;border-top:1px solid #E5E7EB;">
                              <p style="margin:0;font-size:12px;line-height:1.6;color:#9CA3AF;">
                                이 메일은 크크킄 회원가입 요청에 따라 자동 발송되었습니다.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """.formatted(code);
    }
}
