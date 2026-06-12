package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.PostLike;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPagePostLikeRepository extends JpaRepository<PostLike, String> {
    List<PostLike> findByUser_IdOrderByPost_CreatedAtDesc(String userId);

    Optional<PostLike> findByUser_IdAndPost_Id(String userId, String postId);
}
