package com.backend.domain.user.repository;

import com.backend.domain.user.entity.MatchPriceUnit;
import com.backend.domain.user.entity.SocialProvider;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByProviderAndSocialIdAndDeletedAtIsNull(SocialProvider provider, String socialId);

    Optional<User> findByProviderEmailIgnoreCaseAndDeletedAtIsNull(String providerEmail);

    boolean existsByProviderEmailIgnoreCaseAndDeletedAtIsNull(String providerEmail);

    boolean existsByNickname(String nickname);

    boolean existsByNicknameAndIdNot(String nickname, String id);

    @Query("SELECT AVG(u.matchPriceMin) FROM User u WHERE u.role = :role AND u.matchEnabled = true AND u.matchPriceUnit = :unit AND u.matchPriceMin IS NOT NULL")
    Double avgMatchPriceByRoleAndUnit(@Param("role") UserRole role, @Param("unit") MatchPriceUnit unit);

    @Query("SELECT u FROM User u WHERE u.role = 'EDITOR' AND u.matchEnabled = true AND u.createdAt >= :since")
    List<User> findEligibleEditors(@Param("since") LocalDateTime since);

    @Query("SELECT DISTINCT u FROM User u JOIN Portfolio p ON p.user.id = u.id AND p.representative = true WHERE u.role = 'EDITOR' AND u.matchEnabled = true AND u.matchPriceMin IS NOT NULL AND (:maxPrice IS NULL OR u.matchPriceMin <= :maxPrice) AND (:minPrice IS NULL OR u.matchPriceMax >= :minPrice)")
    List<User> findMatchableEditors(@Param("maxPrice") Integer maxPrice, @Param("minPrice") Integer minPrice);

    @Query(value = "SELECT DISTINCT u.* FROM users u JOIN portfolios p ON p.user_id = u.id AND p.is_representative = true WHERE u.role = 'EDITOR' AND u.match_enabled = true AND u.match_price_min IS NOT NULL ORDER BY RAND() LIMIT :count", nativeQuery = true)
    List<User> findRandomMatchableEditors(@Param("count") int count);


}
