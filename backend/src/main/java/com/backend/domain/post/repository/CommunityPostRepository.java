package com.backend.domain.post.repository;

import com.backend.domain.post.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, String> {

    @Query("SELECT c FROM CommunityPost c WHERE (:category IS NULL OR c.category = :category) AND (:q IS NULL OR c.title LIKE %:q% OR c.content LIKE %:q%)")
    List<CommunityPost> search(@Param("category") CommunityPost.Category category, @Param("q") String q);
}
