package com.backend.domain.chat.entity;

import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@NoArgsConstructor
@Getter
@Table(name = "chat_room_users")
public class ChatParticipant extends BaseEntity {

    @ManyToOne(fetch= FetchType.LAZY)
    @JoinColumn(name="room_id", nullable=false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="user_id", nullable=false)
    private User user;

    @Column(name = "unread_count", nullable = false)
    private int unreadCount = 0;

    @Column(name = "joined_at", insertable = false, updatable = false)
    private LocalDateTime joinedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    public ChatParticipant(ChatRoom room, User user) {
        this.chatRoom = room;
        this.user = user;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public void incrementUnreadCount() {
        this.unreadCount++;
    }

    public void markAsRead() {
        this.unreadCount = 0;
    }


}
