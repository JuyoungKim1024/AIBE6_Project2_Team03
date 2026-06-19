package com.backend.domain.profile.entity;

import com.backend.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "portfolio_groups")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioGroup {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "is_representative", nullable = false)
    private boolean representative;

    public PortfolioGroup(User user, String name, int displayOrder, boolean representative) {
        this.user = user;
        this.name = name;
        this.displayOrder = displayOrder;
        this.representative = representative;
    }

    @PrePersist
    void prePersist() {
        if (id == null) {
            id = UUID.randomUUID().toString();
        }
    }

    public void update(String name, int displayOrder, boolean representative) {
        this.name = name;
        this.displayOrder = displayOrder;
        this.representative = representative;
    }
}
