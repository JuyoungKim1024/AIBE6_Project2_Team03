package com.backend.domain.mypage.entity;

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
@Table(name = "posts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Post {

    @Id
    @Column(length = 36)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(name = "board_type", nullable = false, length = 30)
    private BoardType boardType;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type", length = 30)
    private PostType postType;

    @Column(length = 50)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "view_count", nullable = false)
    private int viewCount;

    @Column(name = "like_count", nullable = false)
    private int likeCount;

    @Column(name = "chat_count", nullable = false)
    private int chatCount;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;
}
