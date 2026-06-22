package com.backend.domain.admin.service;

import com.backend.domain.admin.dto.AdminCommentResponse;
import com.backend.domain.admin.dto.AdminPostResponse;
import com.backend.domain.admin.dto.AdminSuspensionRequest;
import com.backend.domain.admin.dto.AdminUserResponse;
import com.backend.domain.post.entity.Comment;
import com.backend.domain.post.repository.CommentRepository;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminManagementService {

    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;

    public List<AdminUserResponse> getUsers(String adminId) {
        requireAdmin(adminId);
        return userRepository.findAll().stream()
                .sorted((left, right) -> right.getCreatedAt().compareTo(left.getCreatedAt()))
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional
    public AdminUserResponse suspendUser(
            String adminId,
            String userId,
            AdminSuspensionRequest request
    ) {
        requireAdmin(adminId);
        User user = getUser(userId);
        if (user.isAdmin()) {
            throw new IllegalArgumentException("관리자 계정은 제한할 수 없습니다.");
        }
        if (user.isDeleted()) {
            throw new IllegalArgumentException("탈퇴한 계정은 제한할 수 없습니다.");
        }
        if (request.unit() == null || request.duration() <= 0) {
            throw new IllegalArgumentException("제한 기간을 올바르게 입력해주세요.");
        }

        long hours = request.unit() == AdminSuspensionRequest.DurationUnit.DAYS
                ? Math.multiplyExact((long) request.duration(), 24)
                : request.duration();
        if (hours > 24L * 365) {
            throw new IllegalArgumentException("제한 기간은 최대 365일까지 설정할 수 있습니다.");
        }

        String reason = request.reason() == null ? "" : request.reason().trim();
        user.suspendUntil(LocalDateTime.now().plusHours(hours), reason);
        return AdminUserResponse.from(user);
    }

    @Transactional
    public AdminUserResponse liftSuspension(String adminId, String userId) {
        requireAdmin(adminId);
        User user = getUser(userId);
        user.liftSuspension();
        return AdminUserResponse.from(user);
    }

    public List<AdminPostResponse> getPosts(String adminId) {
        requireAdmin(adminId);
        return postRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminPostResponse::from)
                .toList();
    }

    @Transactional
    public void deletePost(String adminId, String postId) {
        requireAdmin(adminId);
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }
        postRepository.deleteById(postId);
    }

    public List<AdminCommentResponse> getComments(String adminId) {
        requireAdmin(adminId);
        return commentRepository.findAllByOrderByCreatedAtDesc().stream()
                .map(AdminCommentResponse::from)
                .toList();
    }

    @Transactional
    public void deleteComment(String adminId, String commentId) {
        requireAdmin(adminId);
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        comment.getPost().decrementCommentCount();
        commentRepository.delete(comment);
    }

    private User requireAdmin(String userId) {
        User user = getUser(userId);
        if (!user.isAdmin()) {
            throw new IllegalArgumentException("관리자 권한이 필요합니다.");
        }
        return user;
    }

    private User getUser(String userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }
}
