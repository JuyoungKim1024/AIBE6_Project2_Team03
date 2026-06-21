package com.backend.domain.project.dto;

import com.backend.domain.project.entity.ProjectWorkUnit;
import java.time.LocalDateTime;

public record ProjectCreateRequestDTO (
        String roomId,
        String field,
        Integer price,
        Integer workAmount,
        ProjectWorkUnit workUnit,
        LocalDateTime deadline,
        String memo
) {}
