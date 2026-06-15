package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.Portfolio;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioRepository extends JpaRepository<Portfolio, String> {
    List<Portfolio> findByUser_IdOrderByDisplayOrderAsc(String userId);
    java.util.Optional<Portfolio> findByUser_IdAndRepresentativeTrue(String userId);
    void deleteByUser_Id(String userId);
}
