package com.backend.domain.post.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "post_tags")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PostTag {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(columnDefinition = "CHAR(36)")
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Enumerated(EnumType.STRING)
    @Column(name = "tag_type", nullable = false)
    private TagType tagType;

    @Column(name = "tag_name", nullable = false, length = 50)
    private String tagName;

    public enum TagType {
        FIELD, TOOL, GENERAL
    }

    public PostTag(Post post, TagType tagType, String tagName) {
        this.post = post;
        this.tagType = tagType;
        this.tagName = tagName;
    }
}
