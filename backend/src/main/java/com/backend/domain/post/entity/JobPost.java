package com.backend.domain.post.entity;

import com.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@DiscriminatorValue("JOB")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class JobPost extends Post {

    @Column(name = "min_price")
    private Integer minPrice;

    @Column(name = "max_price")
    private Integer maxPrice;

    @Column(name = "price_visible", nullable = false)
    private boolean priceVisible = true;

    public enum PostType {
        RECRUITING, JOB_SEARCH
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type")
    private PostType postType;

    @Column(name = "portfolio_id", columnDefinition = "CHAR(36)")
    private String portfolioId;



    public JobPost(User author, String title, String content, String thumbnailUrl,
                   Integer minPrice, Integer maxPrice, boolean priceVisible, PostType postType) {
        super(author, title, content, thumbnailUrl);
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.priceVisible = priceVisible;
        this.postType = postType;
    }

    public void update(String title, String content, String thumbnailUrl,
                       Integer minPrice, Integer maxPrice, boolean priceVisible, Integer revisionCount) {
        updateBase(title, content, thumbnailUrl);
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.priceVisible = priceVisible;
        setRevisionCount(revisionCount);
    }
}
