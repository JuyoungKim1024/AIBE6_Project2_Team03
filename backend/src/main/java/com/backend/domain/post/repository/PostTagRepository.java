package com.backend.domain.post.repository;

import com.backend.domain.post.entity.PostTag;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PostTagRepository extends JpaRepository<PostTag, String> {
}
