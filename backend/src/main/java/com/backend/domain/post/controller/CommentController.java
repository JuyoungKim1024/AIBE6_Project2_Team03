package com.backend.domain.post.controller;

import com.backend.domain.auth.service.AuthService;
import com.backend.domain.post.dto.CommentCreateRequest;
import com.backend.domain.post.dto.CommentResponse;
import com.backend.domain.post.dto.CommentUpdateRequest;
import com.backend.domain.post.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;
    private final AuthService authService;

    @GetMapping("/api/posts/{postId}/comments")
    public List<CommentResponse> getComments(@PathVariable String postId) {
        return commentService.getComments(postId);
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable String postId,
            @RequestHeader("Authorization") String authorization,
            @RequestBody CommentCreateRequest request) {
        String userId = authService.resolveUserId(authorization);
        return ResponseEntity.ok(commentService.createComment(postId, userId, request));
    }

    @PatchMapping("/api/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable String commentId,
            @RequestHeader("Authorization") String authorization,
            @RequestBody CommentUpdateRequest request) {
        String userId = authService.resolveUserId(authorization);
        return ResponseEntity.ok(commentService.updateComment(commentId, userId, request));
    }

    @DeleteMapping("/api/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable String commentId,
            @RequestHeader("Authorization") String authorization) {
        String userId = authService.resolveUserId(authorization);
        commentService.deleteComment(commentId, userId);
        return ResponseEntity.noContent().build();
    }
}
