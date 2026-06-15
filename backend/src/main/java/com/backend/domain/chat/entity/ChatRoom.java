package com.backend.domain.chat.entity;

import com.backend.domain.chat.type.ChatRoomType;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Getter
@Table(name = "chat_rooms")
public class ChatRoom extends BaseEntity {

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, name="room_type")
    private ChatRoomType chatRoomType;

    public ChatRoom(ChatRoomType roomType) {
        this.chatRoomType = roomType;
    }
}
