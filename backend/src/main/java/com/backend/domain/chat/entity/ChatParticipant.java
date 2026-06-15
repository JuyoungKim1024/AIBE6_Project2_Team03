package com.backend.domain.chat.entity;

import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

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

    public ChatParticipant(ChatRoom room, User user) {
        this.chatRoom = room;
        this.user = user;
    }


}
