package com.backend.domain.user.repository;

import com.backend.domain.user.entity.Profile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<Profile, String> {
    Optional<Profile> findByUser_Id(String userId);
}
