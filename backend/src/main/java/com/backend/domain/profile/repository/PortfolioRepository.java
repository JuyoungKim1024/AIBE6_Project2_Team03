package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.Portfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PortfolioRepository extends JpaRepository<Portfolio, String> {
    List<Portfolio> findByUser_IdOrderByDisplayOrderAsc(String userId);
    java.util.Optional<Portfolio> findByUser_IdAndRepresentativeTrue(String userId);

    @Modifying
    @Query("DELETE FROM Portfolio p WHERE p.user.id = :userId")
    void deleteByUser_Id(@Param("userId") String userId);
}
