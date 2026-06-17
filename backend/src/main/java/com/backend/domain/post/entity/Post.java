package com.backend.domain.post.entity;

import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.AccessLevel;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "posts")
@Inheritance(strategy = InheritanceType.SINGLE_TABLE)   //상속 구현 - [하위]JopPost, CommunityPost
@DiscriminatorColumn(name = "board_type", discriminatorType = DiscriminatorType.STRING)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public abstract class Post extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String content;

    @Column(name = "thumbnail_url", length = 500)
    private String thumbnailUrl;

    @Column(name = "view_count", nullable = false)
    private int viewCount = 0;

    @Column(name = "like_count", nullable = false)
    private int likeCount = 0;

    @Column(name = "chat_count", nullable = false)
    private int chatCount = 0;

    @Column(name = "public_visible", nullable = false)
    private boolean publicVisible = false;

    @OneToMany(mappedBy = "post", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PostTag> tags = new ArrayList<>();

    protected Post(User author, String title, String content, String thumbnailUrl) {
        this.author = author;
        this.title = title;
        this.content = content;
        this.thumbnailUrl = thumbnailUrl;
    }

    public void incrementViewCount() {
        this.viewCount++;
    }

    public void setViewCount(int viewCount) {
        this.viewCount = viewCount;
    }

    public void updatePublicVisible(boolean publicVisible) {
        this.publicVisible = publicVisible;
    }
}
