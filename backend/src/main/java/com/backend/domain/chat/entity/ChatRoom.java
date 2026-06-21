package com.backend.domain.chat.entity;

import com.backend.domain.chat.type.ChatRoomType;
import com.backend.domain.post.entity.Post;
import com.backend.domain.mypage.entity.MatchRequest;
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

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "match_request_id", unique = true)
    private MatchRequest matchRequest;

    public ChatRoom(ChatRoomType roomType, Post post) {
        this.chatRoomType = roomType;
        this.post = post;
    }

    public ChatRoom(ChatRoomType roomType) {
        this.chatRoomType = roomType;
    }

    public ChatRoom(MatchRequest matchRequest) {
        this.chatRoomType = ChatRoomType.MATCHING;
        this.matchRequest = matchRequest;
    }
}
