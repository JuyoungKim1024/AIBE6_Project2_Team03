package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.PostTag;
import com.backend.domain.profile.entity.Portfolio;
import com.backend.domain.profile.entity.PortfolioGroup;
import com.backend.domain.project.entity.Project;

import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.util.List;

public record JobPostDetailResponse(
        String id,
        AuthorResponse author,
        String title,
        String content,
        Integer minPrice,
        Integer maxPrice,
        boolean priceVisible,
        JobPost.PriceUnit priceUnit,
        JobPost.PostType postType,
        List<AttachedPortfolioGroup> portfolioGroups,
        List<String> fieldTags,
        List<String> toolTags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        int commentCount,
        Integer revisionCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<CompletedDeal> completedDeals
) {
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("yyyy.MM.dd");

    public record CompletedDeal(String createdAt, String field, Integer workAmount, Integer price) {
        public static CompletedDeal from(Project p) {
            return new CompletedDeal(
                    p.getCreatedAt() != null ? p.getCreatedAt().format(DATE_FMT) : null,
                    p.getField(),
                    p.getWorkAmount(),
                    p.getPrice()
            );
        }
    }

    public record AttachedPortfolioItem(String id, String title, String url, String type) {
        public static AttachedPortfolioItem from(Portfolio p) {
            String url = p.getThumbnailUrl() != null ? p.getThumbnailUrl() : p.getImageUrl();
            String type = p.getImageUrl() != null && p.getThumbnailUrl() == null ? "image" : "video";
            return new AttachedPortfolioItem(p.getId(), p.getTitle(), url, type);
        }
    }

    public record AttachedPortfolioGroup(String id, String name, List<AttachedPortfolioItem> items) {
        public static AttachedPortfolioGroup from(PortfolioGroup g) {
            return new AttachedPortfolioGroup(
                    g.getId(),
                    g.getName(),
                    g.getPortfolios().stream().map(AttachedPortfolioItem::from).toList()
            );
        }
    }

    public static JobPostDetailResponse from(JobPost post, List<Project> completedProjects) {
        return new JobPostDetailResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getContent(),
                post.getMinPrice(),
                post.getMaxPrice(),
                post.isPriceVisible(),
                post.getPriceUnit(),
                post.getPostType(),
                post.getPortfolioGroups().stream().map(AttachedPortfolioGroup::from).toList(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.FIELD)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getTags().stream()
                        .filter(t -> t.getTagType() == PostTag.TagType.TOOL)
                        .map(PostTag::getTagName)
                        .toList(),
                post.getThumbnailUrl(),
                post.getViewCount(),
                post.getLikeCount(),
                post.getChatCount(),
                post.getCommentCount(),
                post.getRevisionCount(),
                post.getCreatedAt(),
                post.getUpdatedAt(),
                completedProjects.stream().map(CompletedDeal::from).toList()
        );
    }
}
