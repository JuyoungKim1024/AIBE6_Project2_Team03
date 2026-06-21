package com.backend.domain.dispute.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.dispute.dto.DisputeCreateRequest;
import com.backend.domain.dispute.dto.DisputeNotificationResponse;
import com.backend.domain.dispute.dto.DisputeResponse;
import com.backend.domain.dispute.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;
    private final AuthService authService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public DisputeResponse createDispute(
            @RequestHeader("Authorization") String authorization,
            @Valid @RequestBody DisputeCreateRequest request
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.createDispute(userId, request);
    }

    @GetMapping("/notifications")
    public List<DisputeNotificationResponse> getDisputeNotifications(
            @RequestHeader("Authorization") String authorization
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.getDisputeNotifications(userId);
    }

    @GetMapping("/project/{projectId}/active")
    public ResponseEntity<DisputeResponse> getActiveDisputeByProject(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String projectId
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.getActiveDisputeByProject(userId, projectId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{disputeId}")
    public DisputeResponse getDispute(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String disputeId
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.getDispute(userId, disputeId);
    }

    @PatchMapping("/{disputeId}/respond")
    public DisputeResponse respond(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String disputeId
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.accept(userId, disputeId);
    }
}
