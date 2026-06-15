package com.backend.domain.post.repository;

import com.backend.domain.post.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, String> {

    @Query("SELECT p FROM CommunityPost p JOIN FETCH p.author WHERE p.category = :category ORDER BY p.createdAt DESC")
    List<CommunityPost> findByCategory(@Param("category") CommunityPost.Category category);

    @Query("SELECT p FROM CommunityPost p JOIN FETCH p.author WHERE p.id = :id")
    Optional<CommunityPost> findByIdWithAuthor(@Param("id") String id);
}
