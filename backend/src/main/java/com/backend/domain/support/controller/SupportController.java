package com.backend.domain.support.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.support.dto.SupportDtos.NoticeRequest;
import com.backend.domain.support.dto.SupportDtos.NoticeResponse;
import com.backend.domain.support.dto.SupportDtos.TicketRequest;
import com.backend.domain.support.dto.SupportDtos.TicketResponse;
import com.backend.domain.support.dto.SupportDtos.TicketStatusRequest;
import com.backend.domain.support.entity.SupportTicket;
import com.backend.domain.support.service.SupportService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api")
public class SupportController {
    private final SupportService supportService;
    private final AuthService authService;

    public SupportController(SupportService supportService, AuthService authService) {
        this.supportService = supportService;
        this.authService = authService;
    }

    @GetMapping("/notices")
    public List<NoticeResponse> notices() {
        return supportService.getPublishedNotices();
    }

    @PostMapping("/support/inquiries")
    public TicketResponse createInquiry(@RequestHeader("Authorization") String authorization, @RequestBody TicketRequest request) {
        return supportService.createTicket(authService.resolveUserId(authorization), SupportTicket.Type.INQUIRY, request);
    }

    @PostMapping("/support/reports")
    public TicketResponse createReport(@RequestHeader("Authorization") String authorization, @RequestBody TicketRequest request) {
        return supportService.createTicket(authService.resolveUserId(authorization), SupportTicket.Type.REPORT, request);
    }

    @GetMapping("/support/my-tickets")
    public List<TicketResponse> myTickets(
            @RequestHeader("Authorization") String authorization,
            @RequestParam SupportTicket.Type type
    ) {
        return supportService.getMyTickets(authService.resolveUserId(authorization), type);
    }

    @GetMapping("/admin/notices")
    public List<NoticeResponse> adminNotices(@RequestHeader("Authorization") String authorization) {
        return supportService.getAdminNotices(authService.resolveUserId(authorization));
    }

    @PostMapping("/admin/notices")
    public NoticeResponse createNotice(@RequestHeader("Authorization") String authorization, @RequestBody NoticeRequest request) {
        return supportService.createNotice(authService.resolveUserId(authorization), request);
    }

    @PatchMapping("/admin/notices/{id}")
    public NoticeResponse updateNotice(@RequestHeader("Authorization") String authorization, @PathVariable String id, @RequestBody NoticeRequest request) {
        return supportService.updateNotice(authService.resolveUserId(authorization), id, request);
    }

    @DeleteMapping("/admin/notices/{id}")
    public ResponseEntity<Void> deleteNotice(@RequestHeader("Authorization") String authorization, @PathVariable String id) {
        supportService.deleteNotice(authService.resolveUserId(authorization), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/admin/tickets")
    public List<TicketResponse> tickets(@RequestHeader("Authorization") String authorization, @RequestParam SupportTicket.Type type) {
        return supportService.getTickets(authService.resolveUserId(authorization), type);
    }

    @PatchMapping("/admin/tickets/{id}")
    public TicketResponse updateTicket(@RequestHeader("Authorization") String authorization, @PathVariable String id, @RequestBody TicketStatusRequest request) {
        return supportService.updateTicket(authService.resolveUserId(authorization), id, request);
    }
}
