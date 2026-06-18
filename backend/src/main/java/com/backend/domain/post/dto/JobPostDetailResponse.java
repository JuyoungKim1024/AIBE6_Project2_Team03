package com.backend.domain.post.dto;

import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.PostTag;
import com.backend.domain.profile.entity.Portfolio;

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
        JobPost.PostType postType,
        List<AttachedPortfolio> portfolios,
        List<String> fieldTags,
        List<String> toolTags,
        String thumbnailUrl,
        int viewCount,
        int likeCount,
        int chatCount,
        int commentCount,
        Integer revisionCount,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public record AttachedPortfolio(String id, String title, String url, String type) {
        public static AttachedPortfolio from(Portfolio p) {
            String url = p.getThumbnailUrl() != null ? p.getThumbnailUrl() : p.getImageUrl();
            String type = p.getImageUrl() != null && p.getThumbnailUrl() == null ? "image" : "video";
            return new AttachedPortfolio(p.getId(), p.getTitle(), url, type);
        }
    }

    public static JobPostDetailResponse from(JobPost post) {
        return new JobPostDetailResponse(
                post.getId(),
                AuthorResponse.from(post.getAuthor()),
                post.getTitle(),
                post.getContent(),
                post.getMinPrice(),
                post.getMaxPrice(),
                post.isPriceVisible(),
                post.getPostType(),
                post.getPortfolios().stream().map(AttachedPortfolio::from).toList(),
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
                post.getUpdatedAt()
        );
    }
}
