package com.backend.domain.profile.repository;

import com.backend.domain.profile.entity.UserTag;
import com.backend.domain.profile.entity.UserTagType;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserTagRepository extends JpaRepository<UserTag, String> {
    List<UserTag> findByUser_IdAndTagTypeOrderByTagNameAsc(String userId, UserTagType tagType);
    List<UserTag> findByUser_IdOrderByTagNameAsc(String userId);

    @Modifying
    @Query("DELETE FROM UserTag t WHERE t.user.id = :userId")
    void deleteByUser_Id(@Param("userId") String userId);
}
