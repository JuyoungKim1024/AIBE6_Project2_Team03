package com.backend.domain.dispute.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.dispute.dto.DisputeCreateRequest;
import com.backend.domain.dispute.dto.DisputeRespondRequest;
import com.backend.domain.dispute.dto.DisputeResponse;
import com.backend.domain.dispute.service.DisputeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

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
            @PathVariable String disputeId,
            @Valid @RequestBody DisputeRespondRequest request
    ) {
        String userId = authService.resolveUserId(authorization);
        return disputeService.respond(userId, disputeId, request);
    }
}
