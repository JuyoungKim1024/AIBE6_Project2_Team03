package com.backend.domain.post.service;

import com.backend.domain.post.dto.CommunityPostDetailResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.JobPostCreateRequest;
import com.backend.domain.post.dto.JobPostDetailResponse;
import com.backend.domain.post.dto.JobPostResponse;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.entity.PostTag;
import com.backend.domain.post.repository.CommunityPostRepository;
import com.backend.domain.post.repository.JobPostRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PostService {

    private final JobPostRepository jobPostRepository;
    private final CommunityPostRepository communityPostRepository;
    private final UserRepository userRepository;

    @Transactional
    public String createJobPost(String userId, JobPostCreateRequest req) {
        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        JobPost post = new JobPost(
                author, req.title(), req.content(), req.thumbnailUrl(),
                req.minPrice(), req.maxPrice(), req.priceVisible(), req.postType()
        );
        post.setRevisionCount(req.revisionCount());
        jobPostRepository.save(post);

        if (req.fieldTags() != null) {
            req.fieldTags().forEach(t -> post.getTags().add(new PostTag(post, PostTag.TagType.FIELD, t)));
        }
        if (req.toolTags() != null) {
            req.toolTags().forEach(t -> post.getTags().add(new PostTag(post, PostTag.TagType.TOOL, t)));
        }

        return post.getId();
    }

    public List<JobPostResponse> getJobPosts(JobPost.PostType postType, String q) {
        String keyword = (q == null || q.isBlank()) ? null : q;
        return jobPostRepository.search(postType, keyword).stream()
                .map(JobPostResponse::from)
                .toList();
    }

    public JobPostDetailResponse getJobPost(String id) {
        JobPost post = jobPostRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. id: " + id));
        return JobPostDetailResponse.from(post);
    }

    public List<CommunityPostResponse> getCommunityPosts(CommunityPost.Category category, String q) {
        String keyword = (q == null || q.isBlank()) ? null : q;
        return communityPostRepository.search(category, keyword).stream()
                .map(CommunityPostResponse::from)
                .toList();
    }

    public CommunityPostDetailResponse getCommunityPost(String id) {
        CommunityPost post = communityPostRepository.findByIdWithAuthor(id)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다. id: " + id));
        return CommunityPostDetailResponse.from(post);
    }

}
