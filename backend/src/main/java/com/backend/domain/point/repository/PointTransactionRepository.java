package com.backend.domain.point.repository;

import com.backend.domain.point.entity.PointTransaction;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PointTransactionRepository extends JpaRepository<PointTransaction, String> {
    List<PointTransaction> findByUser_IdOrderByCreatedAtDesc(String userId);
}
