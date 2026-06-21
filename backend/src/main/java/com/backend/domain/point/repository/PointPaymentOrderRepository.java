package com.backend.domain.point.repository;

import com.backend.domain.point.entity.PointPaymentOrder;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface PointPaymentOrderRepository extends JpaRepository<PointPaymentOrder, String> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<PointPaymentOrder> findByOrderIdAndUser_Id(String orderId, String userId);

    boolean existsByPaymentKey(String paymentKey);
}
