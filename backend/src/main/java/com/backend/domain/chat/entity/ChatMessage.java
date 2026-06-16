package com.backend.domain.chat.entity;

import com.backend.domain.chat.type.MessageType;
import com.backend.domain.user.entity.User;
import com.backend.global.jpa.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@NoArgsConstructor
@Getter
@Table(name = "messages")
public class ChatMessage extends BaseEntity {

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="room_id", nullable=false)
    private ChatRoom chatRoom;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="sender_id", nullable=false)
    private User sender;

    @Column(columnDefinition="TEXT")
    private String content;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private MessageType messageType;

    public ChatMessage(ChatRoom room , User sender, String content, MessageType type) {
        this.chatRoom = room;
        this.sender = sender;
        this.content = content;
        this.messageType = type;
    }
}
