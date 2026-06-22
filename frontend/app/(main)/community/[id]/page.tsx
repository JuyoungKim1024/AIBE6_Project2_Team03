"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Edit2,
  Trash2,
  Reply,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { UserActionMenu } from "@/components/common/UserActionMenu";
import {
  fetchCommunityPost,
  fetchComments,
  createComment,
  updateComment,
  deleteComment,
  incrementPostView,
  togglePostLike,
  getPostLikedStatus,
} from "@/lib/api/post";
import { CommunityPostDetailDto, CommentDto } from "@/types/post";
import { formatTimeAgo } from "@/lib/utils/time";
import { useModal } from "@/store/modalStore";
import { getAccessToken } from "@/lib/auth-session";

const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
  INFO: { label: "정보공유", color: "text-cyan-400", bg: "bg-cyan-400/10" },
  FREE: { label: "자유게시판", color: "text-text-secondary", bg: "bg-surface-elevated" },
};

export default function CommunityDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { openModal } = useModal();
  const [post, setPost] = useState<CommunityPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<CommentDto[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingComment, setEditingComment] = useState<{
    id: string;
    isReply: boolean;
    parentId?: string;
  } | null>(null);
  const [editText, setEditText] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    isReply: boolean;
    parentId?: string;
  } | null>(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [postDeleteConfirm, setPostDeleteConfirm] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchCommunityPost(id)
      .then((data) => {
        setPost(data);
        setLikeCount(data.likeCount);
      })
      .catch((err) => console.error("fetchCommunityPost error:", err))
      .finally(() => setLoading(false));
    fetchComments(id).then(setComments).catch(console.error);
    incrementPostView(id).catch(() => {});
    getPostLikedStatus(id).then((r) => setLiked(r.liked)).catch(() => {});
    const token = getAccessToken();
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((user) => user && setCurrentUserId(user.id))
        .catch(() => {});
    }
  }, [id]);

  const handleDeletePost = async () => {
    const token = getAccessToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/community/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("삭제 실패");
      router.push("/community");
    } catch {
      openModal({ title: "삭제 실패", message: "게시글 삭제에 실패했습니다." });
    } finally {
      setPostDeleteConfirm(false);
    }
  };

  const handleLike = async () => {
    if (!getAccessToken()) {
      router.push("/login");
      return;
    }
    try {
      const result = await togglePostLike(id!);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked((prev) => !prev);
      setLikeCount((prev) => liked ? prev - 1 : prev + 1);
    }
  };

  const addComment = async () => {
    if (!newComment.trim() || !id) return;
    const comment = await createComment(id, newComment).catch(console.error);
    if (comment) setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const addReply = async (parentId: string) => {
    if (!replyText.trim() || !id) return;
    const reply = await createComment(id, replyText, parentId).catch(console.error);
    if (reply) {
      setComments((prev) =>
        prev.map((c) =>
          c.id === parentId ? { ...c, replies: [...c.replies, reply] } : c,
        ),
      );
    }
    setReplyingTo(null);
    setReplyText("");
  };

  const saveEdit = async () => {
    if (!editingComment || !editText.trim()) return;
    const updated = await updateComment(editingComment.id, editText).catch(console.error);
    if (!updated) return;
    setComments((prev) =>
      prev.map((c) => {
        if (!editingComment.isReply && c.id === editingComment.id)
          return { ...c, content: updated.content };
        if (editingComment.isReply && c.id === editingComment.parentId)
          return {
            ...c,
            replies: c.replies.map((r) =>
              r.id === editingComment.id ? { ...r, content: updated.content } : r,
            ),
          };
        return c;
      }),
    );
    setEditingComment(null);
    setEditText("");
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    await deleteComment(deleteConfirm.id).catch(console.error);
    setComments(
      (prev) =>
        prev
          .map((c) => {
            if (!deleteConfirm.isReply && c.id === deleteConfirm.id) return null;
            if (deleteConfirm.isReply && c.id === deleteConfirm.parentId)
              return { ...c, replies: c.replies.filter((r) => r.id !== deleteConfirm.id) };
            return c;
          })
          .filter(Boolean) as CommentDto[],
    );
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">불러오는 중...</div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">게시글을 찾을 수 없습니다.</div>
      </div>
    );
  }

  const catConfig = categoryConfig[post.category] ?? categoryConfig.FREE;

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/community"
          className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          목록으로
        </Link>

        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${catConfig.bg} ${catConfig.color}`}>
              {catConfig.label}
            </span>
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <UserActionMenu
                userId={post.author.id}
                nickname={post.author.nickname}
                profileImage={post.author.profileImage}
              />
              <div className="flex items-center gap-2">
                <span className="font-bold text-text-primary">{post.author.nickname}</span>
                <span className="text-text-muted text-sm">·</span>
                <span className="text-text-muted text-sm">{formatTimeAgo(post.createdAt)}</span>
              </div>
            </div>
            {currentUserId === post.author.id && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => router.push(`/community/write?edit=${id}`)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-primary hover:bg-primary/10 transition-colors"
                >
                  <Edit2 size={14} />
                  수정
                </button>
                <button
                  onClick={() => setPostDeleteConfirm(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium text-text-secondary hover:text-accent hover:bg-accent/10 transition-colors"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Body */}
        <div
          className="mb-10 text-text-secondary leading-relaxed [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-text-primary [&_h1]:mb-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-text-primary [&_h2]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-text-primary [&_h3]:mb-2 [&_p]:mb-2 [&_a]:text-primary [&_a]:underline [&_strong]:text-text-primary [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Comments Section */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            댓글 ({comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)})
          </h2>

          {/* Comment Input */}
          {post.author.isDeleted ? (
            <div className="bg-surface border border-border rounded-2xl p-5 mb-6">
              <span className="text-sm text-text-muted">탈퇴한 사용자의 게시글에는 댓글을 작성할 수 없습니다.</span>
            </div>
          ) : currentUserId ? (
            <div className="bg-surface border border-border rounded-2xl p-4 mb-6 focus-within:border-primary transition-colors">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="댓글을 입력하세요..."
                rows={3}
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
              />
              <div className="flex justify-end pt-3 border-t border-border/50 mt-2">
                <button
                  onClick={addComment}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors"
                >
                  댓글 등록
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl p-5 mb-6 flex items-center justify-between gap-4">
              <span className="text-sm text-text-muted">로그인 후 댓글을 작성할 수 있습니다.</span>
              <Link href="/login" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors whitespace-nowrap">
                로그인
              </Link>
            </div>
          )}

          {/* Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id}>
                <div className="bg-surface border border-border rounded-xl p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserActionMenu
                        userId={comment.author.id}
                        nickname={comment.author.nickname}
                        profileImage={comment.author.profileImage}
                        size="sm"
                      />
                      <span className="font-bold text-sm text-text-primary">{comment.author.nickname}</span>
                      <span className="text-text-muted text-xs">·</span>
                      <span className="text-text-muted text-xs">{formatTimeAgo(comment.createdAt)}</span>
                    </div>
                    {currentUserId === comment.author.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditingComment({ id: comment.id, isReply: false }); setEditText(comment.content); }}
                          className="text-text-muted hover:text-primary"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ id: comment.id, isReply: false })}
                          className="text-text-muted hover:text-accent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingComment?.id === comment.id && !editingComment.isReply ? (
                    <div className="mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-elevated rounded-lg">취소</button>
                        <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90">저장</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">{comment.content}</p>
                  )}

                  <button
                    onClick={() => {
                      if (!currentUserId) { router.push("/login"); return; }
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-text-muted hover:text-text-primary transition-colors"
                  >
                    <Reply size={14} /> 답글 달기
                  </button>

                  {replyingTo === comment.id && (
                    <div className="mt-3 bg-surface-elevated/30 border border-border rounded-xl p-3">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="답글을 입력하세요..."
                        className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={() => setReplyingTo(null)} className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-elevated rounded-lg">취소</button>
                        <button onClick={() => addReply(comment.id)} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90">답글 등록</button>
                      </div>
                    </div>
                  )}
                </div>

                {comment.replies.map((reply) => (
                  <div
                    key={reply.id}
                    className="ml-8 mt-3 bg-surface-elevated/50 border border-border rounded-xl p-4 relative group"
                  >
                    <div className="absolute -left-4 top-0 bottom-1/2 border-l border-b border-border/50 w-4 rounded-bl-xl" />
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <UserActionMenu
                          userId={reply.author.id}
                          nickname={reply.author.nickname}
                          profileImage={reply.author.profileImage}
                          size="sm"
                        />
                        <span className="font-bold text-sm text-text-primary">{reply.author.nickname}</span>
                        <span className="text-text-muted text-xs">·</span>
                        <span className="text-text-muted text-xs">{formatTimeAgo(reply.createdAt)}</span>
                      </div>
                      {currentUserId === reply.author.id && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => { setEditingComment({ id: reply.id, isReply: true, parentId: comment.id }); setEditText(reply.content); }}
                            className="text-text-muted hover:text-primary"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ id: reply.id, isReply: true, parentId: comment.id })}
                            className="text-text-muted hover:text-accent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingComment?.id === reply.id && editingComment.isReply ? (
                      <div className="mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button onClick={() => setEditingComment(null)} className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface rounded-lg">취소</button>
                          <button onClick={saveEdit} className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90">저장</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary leading-relaxed">{reply.content}</p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 px-4 pb-6 pointer-events-none">
        <div className="max-w-4xl mx-auto pointer-events-auto">
          <div className="bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-3 flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors ${liked ? "bg-accent/10 text-accent" : "hover:bg-surface-elevated text-text-secondary hover:text-accent"}`}
            >
              <Heart size={18} fill={liked ? "currentColor" : "none"} />
              <span className="text-sm font-bold">{likeCount}</span>
            </button>
            <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-text-secondary">
              <MessageCircle size={18} />
              <span className="text-sm font-bold">{comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Post Delete Confirmation Modal */}
      <AnimatePresence>
        {postDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPostDeleteConfirm(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">게시글을 삭제하시겠습니까?</h3>
              <p className="text-sm text-text-secondary mb-6">삭제된 게시글은 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setPostDeleteConfirm(false)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-text-primary font-bold text-sm hover:bg-border transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Comment Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface border border-border rounded-2xl p-6 text-center shadow-2xl"
            >
              <h3 className="text-lg font-bold text-text-primary mb-2">댓글을 삭제하시겠습니까?</h3>
              <p className="text-sm text-text-secondary mb-6">삭제된 댓글은 복구할 수 없습니다.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-2.5 rounded-xl bg-surface-elevated text-text-primary font-bold text-sm hover:bg-border transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={confirmDelete}
                  className="flex-1 py-2.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-accent/90 transition-colors"
                >
                  삭제
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
