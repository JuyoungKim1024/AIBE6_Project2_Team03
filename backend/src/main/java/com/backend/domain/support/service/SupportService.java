package com.backend.domain.support.service;

import com.backend.domain.support.dto.SupportDtos.NoticeRequest;
import com.backend.domain.support.dto.SupportDtos.NoticeResponse;
import com.backend.domain.support.dto.SupportDtos.TicketRequest;
import com.backend.domain.support.dto.SupportDtos.TicketResponse;
import com.backend.domain.support.dto.SupportDtos.TicketStatusRequest;
import com.backend.domain.support.entity.Notice;
import com.backend.domain.support.entity.SupportTicket;
import com.backend.domain.support.repository.NoticeRepository;
import com.backend.domain.support.repository.SupportTicketRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class SupportService {
    private final NoticeRepository noticeRepository;
    private final SupportTicketRepository ticketRepository;
    private final UserRepository userRepository;

    public SupportService(NoticeRepository noticeRepository, SupportTicketRepository ticketRepository, UserRepository userRepository) {
        this.noticeRepository = noticeRepository;
        this.ticketRepository = ticketRepository;
        this.userRepository = userRepository;
    }

    public List<NoticeResponse> getPublishedNotices() {
        return noticeRepository.findByPublishedTrueOrderByPinnedDescCreatedAtDesc().stream().map(NoticeResponse::from).toList();
    }

    public List<NoticeResponse> getAdminNotices(String adminId) {
        requireAdmin(adminId);
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc().stream().map(NoticeResponse::from).toList();
    }

    @Transactional
    public NoticeResponse createNotice(String adminId, NoticeRequest request) {
        requireAdmin(adminId);
        validateText(request.title(), request.content());
        return NoticeResponse.from(noticeRepository.save(new Notice(request.title().trim(), request.content().trim(), request.pinned(), request.published())));
    }

    @Transactional
    public NoticeResponse updateNotice(String adminId, String noticeId, NoticeRequest request) {
        requireAdmin(adminId);
        validateText(request.title(), request.content());
        Notice notice = noticeRepository.findById(noticeId).orElseThrow(() -> new IllegalArgumentException("공지사항을 찾을 수 없습니다."));
        notice.update(request.title().trim(), request.content().trim(), request.pinned(), request.published());
        return NoticeResponse.from(notice);
    }

    @Transactional
    public void deleteNotice(String adminId, String noticeId) {
        requireAdmin(adminId);
        noticeRepository.deleteById(noticeId);
    }

    @Transactional
    public TicketResponse createTicket(String userId, SupportTicket.Type type, TicketRequest request) {
        validateText(request.title(), request.content());
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        String category = request.category() == null || request.category().isBlank() ? "기타" : request.category().trim();
        return TicketResponse.from(ticketRepository.save(new SupportTicket(user, type, category, request.title().trim(), request.content().trim(), request.targetUrl())));
    }

    public List<TicketResponse> getTickets(String adminId, SupportTicket.Type type) {
        requireAdmin(adminId);
        return ticketRepository.findByTypeOrderByCreatedAtDesc(type).stream().map(TicketResponse::from).toList();
    }

    public List<TicketResponse> getMyTickets(String userId, SupportTicket.Type type) {
        return ticketRepository.findByUser_IdAndTypeOrderByCreatedAtDesc(userId, type)
                .stream()
                .map(TicketResponse::from)
                .toList();
    }

    @Transactional
    public TicketResponse updateTicket(String adminId, String ticketId, TicketStatusRequest request) {
        requireAdmin(adminId);
        SupportTicket ticket = ticketRepository.findById(ticketId).orElseThrow(() -> new IllegalArgumentException("접수 내역을 찾을 수 없습니다."));
        ticket.updateStatus(request.status(), request.adminNote());
        return TicketResponse.from(ticket);
    }

    private void requireAdmin(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
        if (!user.isAdmin()) throw new IllegalArgumentException("관리자 권한이 필요합니다.");
    }

    private void validateText(String title, String content) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("제목을 입력해주세요.");
        if (content == null || content.isBlank()) throw new IllegalArgumentException("내용을 입력해주세요.");
    }
}
