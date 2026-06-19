package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.PortfolioGroup;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PortfolioGroupRepository extends JpaRepository<PortfolioGroup, String> {
    List<PortfolioGroup> findByUser_IdOrderByDisplayOrderAsc(String userId);

    Optional<PortfolioGroup> findByIdAndUser_Id(String id, String userId);

    Optional<PortfolioGroup> findByUser_IdAndRepresentativeTrue(String userId);
}
