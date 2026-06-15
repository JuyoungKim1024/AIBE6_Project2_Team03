package com.backend.domain.post.repository;

import com.backend.domain.post.entity.JobPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface JobPostRepository extends JpaRepository<JobPost, String> {

    @Query("SELECT j FROM JobPost j WHERE (:postType IS NULL OR j.postType = :postType) AND (:q IS NULL OR j.title LIKE %:q% OR j.content LIKE %:q%)")
    List<JobPost> search(@Param("postType") JobPost.PostType postType, @Param("q") String q);
}
