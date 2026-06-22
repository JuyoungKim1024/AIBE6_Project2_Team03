package com.backend.domain.user.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User {

    @Id
    @Column(length = 36)
    private String id;

    @Column(name = "social_id", nullable = false)
    private String socialId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private SocialProvider provider;

    @Column(name = "provider_email")
    private String providerEmail;

    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(name = "email_verified", nullable = false)
    private boolean emailVerified = false;

    @Column(nullable = false, length = 50)
    private String nickname;

    @Column(name = "profile_image", columnDefinition = "LONGTEXT")
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(length = 30)
    private UserRole role;

    @Column(name = "match_enabled", nullable = false)
    private boolean matchEnabled = false;

    @Column(name = "match_price_min")
    private Integer matchPriceMin;

    @Column(name = "match_price_max")
    private Integer matchPriceMax;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_price_unit", length = 20)
    private MatchPriceUnit matchPriceUnit;

    @Column(nullable = false)
    private int point = 0;

    @Column(name = "safe_payment_point", nullable = false)
    private int safePaymentPoint = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @Column(name = "terms_agreed_at")
    private LocalDateTime termsAgreedAt;

    @Column(name = "is_admin", nullable = false)
    private boolean admin = false;

    @Column(name = "is_test_account", nullable = false)
    private boolean testAccount = false;

    @Column(name = "suspended_until")
    private LocalDateTime suspendedUntil;

    @Column(name = "suspension_reason", length = 255)
    private String suspensionReason;

    public User(SocialProvider provider, String socialId, String providerEmail, String nickname, String profileImage) {
        this.provider = provider;
        this.socialId = socialId;
        this.providerEmail = providerEmail;
        this.nickname = nickname;
        this.profileImage = profileImage;
        this.emailVerified = provider != SocialProvider.LOCAL;
    }

    public User(String email, String passwordHash, String nickname) {
        this.provider = SocialProvider.LOCAL;
        this.socialId = email;
        this.providerEmail = email;
        this.passwordHash = passwordHash;
        this.nickname = nickname;
        this.emailVerified = true;
        this.termsAgreedAt = LocalDateTime.now();
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public void updateSocialProfile(String providerEmail, String nickname, String profileImage) {
        this.providerEmail = providerEmail;
        if ((this.profileImage == null || this.profileImage.isBlank()) && profileImage != null && !profileImage.isBlank()) {
            this.profileImage = profileImage;
        }
    }

    public void updateRole(UserRole role) {
        this.role = role;
    }

    public void updateNickname(String nickname) {
        this.nickname = nickname;
    }

    public void updateProfileImage(String profileImage) {
        if (profileImage != null && !profileImage.isBlank()) {
            this.profileImage = profileImage;
        }
    }

    public void updatePassword(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public void withdraw() {
        String withdrawnId = "withdrawn-" + id;
        this.socialId = withdrawnId;
        this.providerEmail = null;
        this.passwordHash = null;
        this.emailVerified = false;
        this.nickname = "탈퇴한 사용자";
        this.profileImage = null;
        this.matchEnabled = false;
        this.matchPriceMin = null;
        this.matchPriceMax = null;
        this.matchPriceUnit = null;
        this.deletedAt = LocalDateTime.now();
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void agreeToTerms() {
        this.termsAgreedAt = LocalDateTime.now();
    }

    public boolean hasAgreedToTerms() {
        return termsAgreedAt != null;
    }

    public boolean isSuspended() {
        return suspendedUntil != null && suspendedUntil.isAfter(LocalDateTime.now());
    }

    public void suspendUntil(LocalDateTime suspendedUntil, String reason) {
        this.suspendedUntil = suspendedUntil;
        this.suspensionReason = reason;
        this.matchEnabled = false;
    }

    public void liftSuspension() {
        this.suspendedUntil = null;
        this.suspensionReason = null;
    }

    public void promoteToAdmin(String email, String passwordHash) {
        this.provider = SocialProvider.LOCAL;
        this.socialId = email;
        this.providerEmail = email;
        this.passwordHash = passwordHash;
        this.emailVerified = true;
        this.nickname = "Admin";
        this.profileImage = null;
        this.role = null;
        this.matchEnabled = false;
        this.termsAgreedAt = LocalDateTime.now();
        this.admin = true;
    }

    public void configureTestAccount(String email, String passwordHash, String nickname, UserRole role) {
        this.provider = SocialProvider.LOCAL;
        this.socialId = email;
        this.providerEmail = email;
        this.passwordHash = passwordHash;
        this.emailVerified = true;
        this.nickname = nickname;
        this.profileImage = null;
        this.role = role;
        this.matchEnabled = false;
        this.termsAgreedAt = LocalDateTime.now();
        this.admin = false;
        this.testAccount = true;
    }

    public void updateMatchingPrice(boolean matchEnabled, Integer matchPriceMin, Integer matchPriceMax, MatchPriceUnit matchPriceUnit) {
        this.matchEnabled = matchEnabled;
        this.matchPriceMin = matchPriceMin;
        this.matchPriceMax = matchPriceMax;
        this.matchPriceUnit = matchPriceUnit;
    }

    public void chargePoint(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("충전 금액은 0보다 커야 합니다.");
        this.point += amount;
    }

    public void holdSafePayment(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("안전결제 금액은 0보다 커야 합니다.");
        if (this.point < amount) throw new IllegalStateException("포인트가 부족합니다.");
        this.point -= amount;
        this.safePaymentPoint += amount;
    }

    public void releaseSafePayment(int amount, User recipient) {
        if (amount <= 0) throw new IllegalArgumentException("정산 금액은 0보다 커야 합니다.");
        if (this.safePaymentPoint < amount) throw new IllegalStateException("안전결제 잔액이 부족합니다.");
        // 수신자에게 먼저 지급 후 차감: 예외 발생 시 차감이 일어나지 않아 안전
        recipient.chargePoint(amount);
        this.safePaymentPoint -= amount;
    }

    public void refundSafePayment(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("환불 금액은 0보다 커야 합니다.");
        if (this.safePaymentPoint < amount) throw new IllegalStateException("안전결제 잔액이 부족합니다.");
        this.safePaymentPoint -= amount;
        this.point += amount;
    }
}
