package com.backend.domain.project.dto;

import java.time.LocalDateTime;

public record ProjectCreateRequestDTO (
        String roomId,
        String field,
        Integer price,
        Integer videoLength,
        LocalDateTime deadline,
        String memo
) {}
