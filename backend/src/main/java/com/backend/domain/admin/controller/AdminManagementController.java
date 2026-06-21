package com.backend.domain.admin.controller;

import com.backend.domain.admin.dto.AdminCommentResponse;
import com.backend.domain.admin.dto.AdminPostResponse;
import com.backend.domain.admin.dto.AdminSuspensionRequest;
import com.backend.domain.admin.dto.AdminUserResponse;
import com.backend.domain.admin.service.AdminManagementService;
import com.backend.domain.auth.service.AuthService;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminManagementController {

    private final AuthService authService;
    private final AdminManagementService adminManagementService;

    @GetMapping("/users")
    public List<AdminUserResponse> users(@RequestHeader("Authorization") String authorization) {
        return adminManagementService.getUsers(authService.resolveUserId(authorization));
    }

    @PostMapping("/users/{userId}/suspension")
    public AdminUserResponse suspend(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String userId,
            @RequestBody AdminSuspensionRequest request
    ) {
        return adminManagementService.suspendUser(
                authService.resolveUserId(authorization),
                userId,
                request
        );
    }

    @DeleteMapping("/users/{userId}/suspension")
    public AdminUserResponse lift(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String userId
    ) {
        return adminManagementService.liftSuspension(
                authService.resolveUserId(authorization),
                userId
        );
    }

    @GetMapping("/posts")
    public List<AdminPostResponse> posts(@RequestHeader("Authorization") String authorization) {
        return adminManagementService.getPosts(authService.resolveUserId(authorization));
    }

    @DeleteMapping("/posts/{postId}")
    public ResponseEntity<Void> deletePost(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String postId
    ) {
        adminManagementService.deletePost(authService.resolveUserId(authorization), postId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/comments")
    public List<AdminCommentResponse> comments(@RequestHeader("Authorization") String authorization) {
        return adminManagementService.getComments(authService.resolveUserId(authorization));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @RequestHeader("Authorization") String authorization,
            @PathVariable String commentId
    ) {
        adminManagementService.deleteComment(authService.resolveUserId(authorization), commentId);
        return ResponseEntity.noContent().build();
    }
}
