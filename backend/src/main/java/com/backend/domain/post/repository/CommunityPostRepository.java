package com.backend.domain.post.repository;

import com.backend.domain.post.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, String> {

    List<CommunityPost> findByCategory(CommunityPost.Category category);
}
