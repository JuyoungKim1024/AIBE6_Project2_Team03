package com.backend.domain.mypage.repository;

import com.backend.domain.mypage.entity.ChatRoomUser;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MyPageChatRoomUserRepository extends JpaRepository<ChatRoomUser, String> {
    List<ChatRoomUser> findByUser_IdOrderByJoinedAtDesc(String userId);

    List<ChatRoomUser> findByRoom_Id(String roomId);
}
