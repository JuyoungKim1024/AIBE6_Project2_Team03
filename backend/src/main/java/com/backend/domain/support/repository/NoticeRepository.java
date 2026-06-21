package com.backend.domain.support.repository;

import com.backend.domain.support.entity.Notice;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NoticeRepository extends JpaRepository<Notice, String> {
    List<Notice> findByPublishedTrueOrderByPinnedDescCreatedAtDesc();
    List<Notice> findAllByOrderByPinnedDescCreatedAtDesc();
}
