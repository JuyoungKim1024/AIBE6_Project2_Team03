package com.backend.domain.post.repository;

import com.backend.domain.post.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PostLikeRepository extends JpaRepository<PostLike, String> {
    Optional<PostLike> findByPost_IdAndUser_Id(String postId, String userId);
    boolean existsByPost_IdAndUser_Id(String postId, String userId);

    @Query("SELECT pl.post.id FROM PostLike pl WHERE pl.user.id = :userId")
    List<String> findPostIdsByUserId(@Param("userId") String userId);
}
