package com.backend.domain.chat.entity;

import com.backend.domain.chat.type.ChatRequestStatus;
import com.backend.domain.post.entity.Post;
import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Getter
@Table(name = "chat_requests")
public class ChatRequest extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "requester_id", nullable = false)
    private User requester;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id", nullable = false)
    private User receiver;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChatRequestStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private ChatRoom chatRoom;


    public ChatRequest(User requester, User receiver, Post post, String message) {
        this.requester = requester;
        this.receiver = receiver;
        this.post = post;
        this.message = message;
        this.status = ChatRequestStatus.WAITING;
    }

    public void accept(ChatRoom chatRoom) {
        this.status = ChatRequestStatus.ACCEPTED;
        this.chatRoom = chatRoom;
    }

    public void reject() {
        this.status = ChatRequestStatus.REJECTED;
    }

}
