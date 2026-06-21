package com.backend.domain.point.entity;

import com.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "point_payment_orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PointPaymentOrder {

    @Id
    @Column(name = "order_id", length = 64)
    private String orderId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int amount;

    @Column(nullable = false)
    private int points;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PointPaymentStatus status;

    @Column(name = "payment_key", unique = true, length = 200)
    private String paymentKey;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "approved_at")
    private LocalDateTime approvedAt;

    public PointPaymentOrder(String orderId, User user, int amount, int points) {
        this.orderId = orderId;
        this.user = user;
        this.amount = amount;
        this.points = points;
        this.status = PointPaymentStatus.READY;
    }

    public void complete(String paymentKey) {
        this.paymentKey = paymentKey;
        this.status = PointPaymentStatus.DONE;
        this.approvedAt = LocalDateTime.now();
    }
}
