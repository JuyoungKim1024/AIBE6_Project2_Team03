package com.backend.domain.chat.entity;

import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.post.entity.Post;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    public ChatRoom(ChatRoomType roomType, Post post) {
        this.chatRoomType = roomType;
        this.post = post;
    }

    public ChatRoom(ChatRoomType roomType) {
        this.chatRoomType = roomType;
    }
}
