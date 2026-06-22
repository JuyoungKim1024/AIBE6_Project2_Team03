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

    @Column(name = "file_url", length = 2048)
    private String fileUrl;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "content_type", length = 100)
    private String contentType;

    public ChatMessage(ChatRoom room , User sender, String content, MessageType type) {
        this(room, sender, content, type, null, null, null, null);
    }

    public ChatMessage(
            ChatRoom room,
            User sender,
            String content,
            MessageType type,
            String fileUrl,
            String fileName,
            Long fileSize,
            String contentType
    ) {
        this.chatRoom = room;
        this.sender = sender;
        this.content = content;
        this.messageType = type;
        this.fileUrl = fileUrl;
        this.fileName = fileName;
        this.fileSize = fileSize;
        this.contentType = contentType;
    }
}
