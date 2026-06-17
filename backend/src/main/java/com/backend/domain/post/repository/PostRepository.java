package com.backend.domain.post.repository;

import com.backend.domain.post.entity.Post;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PostRepository extends JpaRepository<Post,String> {
    List<Post> findByAuthor_IdOrderByCreatedAtDesc(String authorId);

    List<Post> findByAuthor_IdAndPublicVisibleTrueOrderByCreatedAtDesc(String authorId);
}
