package com.backend.domain.post.entity;

import com.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("COMMUNITY")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CommunityPost extends Post {

    @Enumerated(EnumType.STRING)
    @Column
    private Category category;

    public enum Category {
        INFO, FREE
    }

    public CommunityPost(User author, String title, String content, String thumbnailUrl,
                         Category category) {
        super(author, title, content, thumbnailUrl);
        this.category = category;
    }

    public void update(String title, String content, String thumbnailUrl, Category category) {
        updateBase(title, content, thumbnailUrl);
        this.category = category;
    }
}
