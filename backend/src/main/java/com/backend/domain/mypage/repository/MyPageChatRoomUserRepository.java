package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.ChatRoomUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface MyPageChatRoomUserRepository extends JpaRepository<ChatRoomUser, String> {
    List<ChatRoomUser> findByUser_IdOrderByJoinedAtDesc(String userId);

    List<ChatRoomUser> findByRoom_Id(String roomId);

    @Query("SELECT COALESCE(SUM(c.unreadCount), 0) FROM ChatRoomUser c WHERE c.user.id = :userId")
    int sumUnreadCountByUserId(@Param("userId") String userId);
}
