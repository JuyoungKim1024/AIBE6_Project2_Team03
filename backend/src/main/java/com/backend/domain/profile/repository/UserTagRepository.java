package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserTagRepository extends JpaRepository<UserTag, String> {
    List<UserTag> findByUser_IdAndTagTypeOrderByTagNameAsc(String userId, UserTagType tagType);
    List<UserTag> findByUser_IdOrderByTagNameAsc(String userId);
    void deleteByUser_Id(String userId);
}
