package com.backend.domain.support.dto;

import com.backend.domain.support.entity.Notice;
import com.backend.domain.support.entity.SupportTicket;
import java.time.LocalDateTime;

public final class SupportDtos {
    private SupportDtos() {}

    public record NoticeRequest(String title, String content, boolean pinned, boolean published) {}
    public record NoticeResponse(String id, String title, String content, boolean pinned, boolean published, LocalDateTime createdAt) {
        public static NoticeResponse from(Notice notice) {
            return new NoticeResponse(notice.getId(), notice.getTitle(), notice.getContent(), notice.isPinned(), notice.isPublished(), notice.getCreatedAt());
        }
    }
    public record TicketRequest(String category, String title, String content, String targetUrl) {}
    public record TicketStatusRequest(SupportTicket.Status status, String adminNote) {}
    public record TicketResponse(
            String id, SupportTicket.Type type, String category, String title, String content,
            String targetUrl, SupportTicket.Status status, String adminNote,
            String userId, String userNickname, String userEmail, LocalDateTime createdAt
    ) {
        public static TicketResponse from(SupportTicket ticket) {
            return new TicketResponse(
                    ticket.getId(), ticket.getType(), ticket.getCategory(), ticket.getTitle(), ticket.getContent(),
                    ticket.getTargetUrl(), ticket.getStatus(), ticket.getAdminNote(),
                    ticket.getUser().getId(), ticket.getUser().getNickname(), ticket.getUser().getProviderEmail(), ticket.getCreatedAt()
            );
        }
    }
}
