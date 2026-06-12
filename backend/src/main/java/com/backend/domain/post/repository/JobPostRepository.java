package com.backend.domain.post.repository;

import com.backend.domain.post.entity.JobPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface JobPostRepository extends JpaRepository<JobPost, String> {

    List<JobPost> findByPostType(JobPost.PostType postType);
}
