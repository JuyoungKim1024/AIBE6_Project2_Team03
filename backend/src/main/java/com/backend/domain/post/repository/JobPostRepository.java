package com.backend.domain.post.repository;

import com.backend.domain.post.entity.JobPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface JobPostRepository extends JpaRepository<JobPost, String> {

    @Query("SELECT p FROM JobPost p JOIN FETCH p.author WHERE p.postType = :postType ORDER BY p.createdAt DESC")
    List<JobPost> findByPostType(@Param("postType") JobPost.PostType postType);

    @Query("SELECT p FROM JobPost p JOIN FETCH p.author WHERE p.id = :id")
    Optional<JobPost> findByIdWithAuthor(@Param("id") String id);
    @Query("SELECT j FROM JobPost j WHERE (:postType IS NULL OR j.postType = :postType) AND (:q IS NULL OR j.title LIKE %:q% OR j.content LIKE %:q%)")
    List<JobPost> search(@Param("postType") JobPost.PostType postType, @Param("q") String q);
}
