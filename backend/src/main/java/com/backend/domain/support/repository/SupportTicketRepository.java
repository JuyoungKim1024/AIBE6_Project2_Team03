package com.backend.domain.support.repository;

import com.backend.domain.support.entity.SupportTicket;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SupportTicketRepository extends JpaRepository<SupportTicket, String> {
    List<SupportTicket> findByTypeOrderByCreatedAtDesc(SupportTicket.Type type);
}
