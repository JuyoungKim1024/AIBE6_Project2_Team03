package com.backend.domain.support.entity;

import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "notices")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Notice extends BaseEntity {

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "is_pinned", nullable = false)
    private boolean pinned;

    @Column(name = "is_published", nullable = false)
    private boolean published;

    public Notice(String title, String content, boolean pinned, boolean published) {
        update(title, content, pinned, published);
    }

    public void update(String title, String content, boolean pinned, boolean published) {
        this.title = title;
        this.content = content;
        this.pinned = pinned;
        this.published = published;
    }
}
