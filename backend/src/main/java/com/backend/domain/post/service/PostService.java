package com.backend.domain.post.service;

import com.backend.domain.post.dto.CommunityPostDetailResponse;
import com.backend.domain.post.dto.CommunityPostResponse;
import com.backend.domain.post.dto.JobPostDetailResponse;
import com.backend.domain.post.dto.JobPostResponse;
import com.backend.domain.post.entity.CommunityPost;
import com.backend.domain.post.entity.JobPost;
import com.backend.domain.post.repository.CommunityPostRepository;
import com.backend.domain.post.repository.JobPostRepository;
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
