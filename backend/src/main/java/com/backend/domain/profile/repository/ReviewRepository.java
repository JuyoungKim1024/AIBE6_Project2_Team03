package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.Review;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewRepository extends JpaRepository<Review, String> {
    List<Review> findByTargetUser_IdOrderByCreatedAtDesc(String userId);

    @Query("SELECT COALESCE(AVG(r.rating), 0) FROM Review r WHERE r.targetUser.id = :userId")
    Double avgRatingByUserId(@Param("userId") String userId);

    long countByTargetUser_Id(String userId);

    boolean existsByProject_Id(String projectId);
}
