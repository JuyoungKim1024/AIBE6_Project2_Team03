package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.Post;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPagePostRepository extends JpaRepository<Post, String> {
    List<Post> findByAuthor_IdOrderByCreatedAtDesc(String authorId);

    Optional<Post> findByIdAndAuthor_Id(String id, String authorId);
}
