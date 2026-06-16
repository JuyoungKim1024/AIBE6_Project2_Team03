package com.backend.domain.profile.entity;

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
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Getter
@Entity
@Table(name = "user_tags")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserTag {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag_type", nullable = false, length = 30)
    private UserTagType tagType;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    public UserTag(User user, UserTagType tagType, String tagName) {
        this.id = UUID.randomUUID().toString();
        this.user = user;
        this.tagType = tagType;
        this.tagName = tagName;
    }
}
