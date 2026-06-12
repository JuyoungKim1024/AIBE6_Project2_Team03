package com.backend.domain.user.repository;

import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.User;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByProviderAndSocialId(SocialProvider provider, String socialId);

    boolean existsByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, String id);
}
