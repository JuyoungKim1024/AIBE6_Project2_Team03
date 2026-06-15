package com.backend.domain.chat.dto;

import com.backend.domain.chat.type.ChatRoomType;
import java.util.List;

public record ChatRoomCreateRequestDTO (
        ChatRoomType roomType,
        List<String> participantUserIds
){}
