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

    @Column(name = "manner_score", nullable = false)
    private int mannerScore = 30;

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

    @Column(name = "escrow_point", nullable = false)
    private int escrowPoint = 0;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

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

    public void holdEscrow(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("에스크로 금액은 0보다 커야 합니다.");
        if (this.point < amount) throw new IllegalStateException("포인트가 부족합니다.");
        this.point -= amount;
        this.escrowPoint += amount;
    }

    public void releaseEscrow(int amount, User recipient) {
        if (amount <= 0) throw new IllegalArgumentException("정산 금액은 0보다 커야 합니다.");
        if (this.escrowPoint < amount) throw new IllegalStateException("에스크로 잔액이 부족합니다.");
        this.escrowPoint -= amount;
        recipient.chargePoint(amount);
    }

    public void refundEscrow(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("환불 금액은 0보다 커야 합니다.");
        if (this.escrowPoint < amount) throw new IllegalStateException("에스크로 잔액이 부족합니다.");
        this.escrowPoint -= amount;
        this.point += amount;
    }
}
