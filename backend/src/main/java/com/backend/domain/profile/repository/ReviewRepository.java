package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByTargetUser_IdOrderByCreatedAtDesc(String userId);
}
