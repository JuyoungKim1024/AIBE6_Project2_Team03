package com.backend.domain.post.service;

import com.backend.domain.post.dto.CommentCreateRequest;
import com.backend.domain.post.dto.CommentResponse;
import com.backend.domain.post.dto.CommentUpdateRequest;
import com.backend.domain.post.entity.Comment;
import com.backend.domain.post.entity.Post;
import com.backend.domain.post.repository.CommentRepository;
import com.backend.domain.post.repository.PostRepository;
import com.backend.domain.user.entity.User;
import com.backend.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    public List<CommentResponse> getComments(String postId) {
        List<Comment> all = commentRepository.findAllByPostId(postId);

        Map<String, List<Comment>> byParent = all.stream()
                .filter(c -> c.getParent() != null)
                .collect(Collectors.groupingBy(c -> c.getParent().getId()));

        return all.stream()
                .filter(c -> c.getParent() == null)
                .map(c -> CommentResponse.of(c, byParent.getOrDefault(c.getId(), List.of())))
                .toList();
    }

    @Transactional
    public CommentResponse createComment(String postId, String userId, CommentCreateRequest req) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));
        User writer = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment parent = null;
        if (req.parentId() != null) {
            parent = commentRepository.findById(req.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("부모 댓글을 찾을 수 없습니다."));
        }

        Comment comment = new Comment(post, writer, parent, req.content());
        commentRepository.save(comment);
        post.incrementCommentCount();
        return CommentResponse.of(comment, List.of());
    }

    @Transactional
    public CommentResponse updateComment(String commentId, String userId, CommentUpdateRequest req) {
        Comment comment = getOwnComment(commentId, userId);
        comment.updateContent(req.content());
        return CommentResponse.of(comment, List.of());
    }

    @Transactional
    public void deleteComment(String commentId, String userId) {
        Comment comment = getOwnComment(commentId, userId);
        comment.getPost().decrementCommentCount();
        commentRepository.delete(comment);
    }

    private Comment getOwnComment(String commentId, String userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));
        if (!comment.getWriter().getId().equals(userId)) {
            throw new IllegalArgumentException("본인의 댓글만 수정/삭제할 수 있습니다.");
        }
        return comment;
    }
}
