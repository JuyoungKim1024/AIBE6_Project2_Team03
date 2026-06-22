package com.backend.domain.post.entity;

import com.backend.domain.profile.entity.PortfolioGroup;
import com.backend.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

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

    public enum PriceUnit {
        PER_MINUTE, PER_PROJECT
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit", length = 20)
    private PriceUnit priceUnit = PriceUnit.PER_MINUTE;

    @Enumerated(EnumType.STRING)
    @Column(name = "post_type")
    private PostType postType;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "job_post_portfolio_groups",
            joinColumns = @JoinColumn(name = "post_id"),
            inverseJoinColumns = @JoinColumn(name = "group_id")
    )
    private List<PortfolioGroup> portfolioGroups = new ArrayList<>();

    public JobPost(User author, String title, String content, String thumbnailUrl,
                   Integer minPrice, Integer maxPrice, boolean priceVisible, PostType postType, PriceUnit priceUnit) {
        super(author, title, content, thumbnailUrl);
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.priceVisible = priceVisible;
        this.postType = postType;
        this.priceUnit = priceUnit != null ? priceUnit : PriceUnit.PER_MINUTE;
    }

    public void update(String title, String content, String thumbnailUrl,
                       Integer minPrice, Integer maxPrice, boolean priceVisible, Integer revisionCount, PriceUnit priceUnit) {
        updateBase(title, content, thumbnailUrl);
        this.minPrice = minPrice;
        this.maxPrice = maxPrice;
        this.priceVisible = priceVisible;
        this.priceUnit = priceUnit != null ? priceUnit : PriceUnit.PER_MINUTE;
        setRevisionCount(revisionCount);
    }
}
