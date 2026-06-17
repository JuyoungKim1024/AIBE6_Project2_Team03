"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Video,
  Wrench,
  DollarSign,
  RotateCcw,
  Heart,
  MessageCircle,
  Send,
  X,
  Edit2,
  Trash2,
  Reply,
  User,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { fetchJobPost, fetchComments, createComment, updateComment, deleteComment } from "@/lib/api/post";
import { JobPostDetailDto, CommentDto } from "@/types/post";
import { formatTimeAgo } from "@/lib/utils/time";

export default function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<JobPostDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [showChatPanel, setShowChatPanel] = useState(false);
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

  useEffect(() => {
    if (!id) return;
    fetchJobPost(id)
      .then((data) => {
        setPost(data);
        setLikeCount(data.likeCount);
      })
      .catch((err) => console.error("fetchJobPost error:", err))
      .finally(() => setLoading(false));
    fetchComments(id).then(setComments).catch(console.error);
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : null)
        .then((user) => user && setCurrentUserId(user.id))
        .catch(() => {});
    }
  }, [id]);

  const handleLike = () => {
    if (liked) {
      setLikeCount((prev) => prev - 1);
      setLiked(false);
    } else {
      setLikeCount((prev) => prev + 1);
      setLiked(true);
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
    setComments((prev) =>
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

  const postTypeLabel = post.postType === "RECRUITING" ? "구인" : "구직";
  const priceText =
    post.priceVisible && (post.minPrice || post.maxPrice)
      ? post.minPrice && post.maxPrice
        ? `₩${post.minPrice.toLocaleString("ko-KR")} ~ ₩${post.maxPrice.toLocaleString("ko-KR")}`
        : `₩${(post.minPrice ?? post.maxPrice)!.toLocaleString("ko-KR")}`
      : "단가 비공개";

  const conditions = [
    {
      icon: Video,
      label: "콘텐츠 타입",
      value: post.fieldTags.length > 0 ? post.fieldTags.join(", ") : "-",
    },
    {
      icon: Wrench,
      label: "사용 툴",
      value: post.toolTags.length > 0 ? post.toolTags.join(", ") : "-",
    },
    {
      icon: DollarSign,
      label: "단가",
      value: post.priceVisible ? priceText : "단가 비공개",
    },
    {
      icon: RotateCcw,
      label: "수정 횟수",
      value: "-",
    },
  ];

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <Link
          href="/jobs"
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
            <span className={`px-2.5 py-1 rounded-md text-xs font-bold ${post.postType === "RECRUITING" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"}`}>
              {postTypeLabel}
            </span>
            {post.fieldTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-secondary border border-border/50"
              >
                {tag}
              </span>
            ))}
            {post.toolTags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-secondary border border-border/50"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-3xl font-bold text-text-primary mb-4 leading-tight">
            {post.title}
          </h1>

          <div className="flex items-center gap-3 mb-6">
            {post.author.profileImage ? (
              <img
                src={post.author.profileImage}
                alt={post.author.nickname}
                className="w-10 h-10 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                <User size={18} className="text-text-secondary" />
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="font-bold text-text-primary">
                {post.author.nickname}
              </span>
              <span className="text-text-muted text-sm">·</span>
              <span className="text-text-muted text-sm">
                {formatTimeAgo(post.createdAt)}
              </span>
            </div>
          </div>

          {post.priceVisible && (post.minPrice || post.maxPrice) && (
            <div className="inline-flex items-center gap-3 bg-primary/10 border border-primary/30 rounded-xl px-5 py-3">
              <span className="font-mono text-2xl font-bold text-primary">
                {priceText}
                <span className="text-base font-sans text-primary/70">/분</span>
              </span>
              {post.fieldTags.length > 0 && (
                <>
                  <div className="h-6 w-px bg-primary/30" />
                  <span className="text-sm text-text-primary font-medium">
                    {post.fieldTags.join(" · ")}
                    {post.toolTags.length > 0 &&
                      ` · ${post.toolTags.join(", ")}`}
                  </span>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Body */}
        <div
          className="prose prose-invert max-w-none mb-10 text-text-secondary leading-relaxed"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {/* Work Condition Summary */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <h2 className="text-lg font-bold text-text-primary mb-5">
            작업 조건 요약
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {conditions.map((cond, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-elevated flex items-center justify-center flex-shrink-0">
                  <cond.icon size={18} className="text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs text-text-muted mb-0.5">
                    {cond.label}
                  </div>
                  <div className="text-sm font-bold text-text-primary">
                    {cond.value}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-surface border border-border rounded-2xl p-6 mb-10">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-lg font-bold text-text-primary">
              작성자의 이전 거래 내역
            </h2>
            <span className="text-xs text-text-muted">투명한 단가 공개</span>
          </div>
          <div className="flex items-center justify-center py-10 text-text-muted text-sm">
            거래 내역이 없습니다.
          </div>
        </div>

        {/* Comments Section */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-5">
            댓글 ({comments.length + comments.reduce((acc, c) => acc + c.replies.length, 0)})
          </h2>

          {/* Comment Input */}
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

          {/* Comments */}
          <div className="space-y-4">
            {comments.map((comment) => (
              <div key={comment.id}>
                <div className="bg-surface border border-border rounded-xl p-4 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {comment.author.profileImage ? (
                        <img
                          src={comment.author.profileImage}
                          alt={comment.author.nickname}
                          className="w-7 h-7 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                          <User size={13} className="text-text-secondary" />
                        </div>
                      )}
                      <span className="font-bold text-sm text-text-primary">
                        {comment.author.nickname}
                      </span>
                      <span className="text-text-muted text-xs">·</span>
                      <span className="text-text-muted text-xs">
                        {formatTimeAgo(comment.createdAt)}
                      </span>
                    </div>
                    {currentUserId === comment.author.id && (
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingComment({ id: comment.id, isReply: false });
                            setEditText(comment.content);
                          }}
                          className="text-text-muted hover:text-primary"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() =>
                            setDeleteConfirm({ id: comment.id, isReply: false })
                          }
                          className="text-text-muted hover:text-accent"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingComment?.id === comment.id &&
                  !editingComment.isReply ? (
                    <div className="mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full bg-surface-elevated border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setEditingComment(null)}
                          className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-elevated rounded-lg"
                        >
                          취소
                        </button>
                        <button
                          onClick={saveEdit}
                          className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          저장
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-text-secondary leading-relaxed mb-3">
                      {comment.content}
                    </p>
                  )}

                  <button
                    onClick={() =>
                      setReplyingTo(
                        replyingTo === comment.id ? null : comment.id,
                      )
                    }
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
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface-elevated rounded-lg"
                        >
                          취소
                        </button>
                        <button
                          onClick={() => addReply(comment.id)}
                          className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90"
                        >
                          답글 등록
                        </button>
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
                        {reply.author.profileImage ? (
                          <img
                            src={reply.author.profileImage}
                            alt={reply.author.nickname}
                            className="w-6 h-6 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                            <User size={11} className="text-text-secondary" />
                          </div>
                        )}
                        <span className="font-bold text-sm text-text-primary">
                          {reply.author.nickname}
                        </span>
                        <span className="text-text-muted text-xs">·</span>
                        <span className="text-text-muted text-xs">
                          {formatTimeAgo(reply.createdAt)}
                        </span>
                      </div>
                      {currentUserId === reply.author.id && (
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => {
                              setEditingComment({
                                id: reply.id,
                                isReply: true,
                                parentId: comment.id,
                              });
                              setEditText(reply.content);
                            }}
                            className="text-text-muted hover:text-primary"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteConfirm({
                                id: reply.id,
                                isReply: true,
                                parentId: comment.id,
                              })
                            }
                            className="text-text-muted hover:text-accent"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>

                    {editingComment?.id === reply.id &&
                    editingComment.isReply ? (
                      <div className="mt-2">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full bg-surface border border-border rounded-lg p-2 text-sm text-text-primary focus:outline-none focus:border-primary resize-none"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2 mt-2">
                          <button
                            onClick={() => setEditingComment(null)}
                            className="px-3 py-1.5 text-xs font-bold text-text-secondary hover:bg-surface rounded-lg"
                          >
                            취소
                          </button>
                          <button
                            onClick={saveEdit}
                            className="px-3 py-1.5 text-xs font-bold bg-primary text-white rounded-lg hover:bg-primary/90"
                          >
                            저장
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-text-secondary leading-relaxed">
                        {reply.content}
                      </p>
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
          <div className="bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-colors ${liked ? "bg-accent/10 text-accent" : "hover:bg-surface-elevated text-text-secondary hover:text-accent"}`}
              >
                <Heart size={18} fill={liked ? "currentColor" : "none"} />
                <span className="text-sm font-bold">{likeCount}</span>
              </button>
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-text-secondary">
                <MessageCircle size={18} />
                <span className="text-sm font-bold">{post.chatCount}</span>
              </div>
            </div>
            <button
              onClick={() => setShowChatPanel(true)}
              className="flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.3)]"
            >
              <Send size={16} />
              채팅 문의하기
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
              <h3 className="text-lg font-bold text-text-primary mb-2">
                댓글을 삭제하시겠습니까?
              </h3>
              <p className="text-sm text-text-secondary mb-6">
                삭제된 댓글은 복구할 수 없습니다.
              </p>
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

      {/* Right Sidebar: Chat Panel */}
      <AnimatePresence>
        {showChatPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowChatPanel(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full max-w-md bg-surface border-l border-border shadow-2xl z-[101] flex flex-col"
            >
              <div className="flex items-center justify-between p-5 border-b border-border bg-surface/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  {post.author.profileImage ? (
                    <img
                      src={post.author.profileImage}
                      alt={post.author.nickname}
                      className="w-10 h-10 rounded-full object-cover border border-border"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center border border-border">
                      <User size={18} className="text-text-secondary" />
                    </div>
                  )}
                  <div>
                    <span className="font-bold text-text-primary block">
                      {post.author.nickname}
                    </span>
                    <span className="text-xs text-text-muted">
                      보통 1시간 이내 응답
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowChatPanel(false)}
                  className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-elevated transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 bg-background/50 flex flex-col gap-4">
                <div className="text-center text-xs text-text-muted my-4">
                  채팅이 시작되었습니다.
                </div>
                <div className="flex justify-end">
                  <div className="max-w-[80%] bg-primary text-white px-4 py-2.5 rounded-2xl rounded-br-md text-sm">
                    안녕하세요! 올려주신 구인글 보고 연락드립니다.
                  </div>
                </div>
              </div>
              <div className="p-4 border-t border-border bg-surface">
                <div className="flex items-center gap-2 bg-surface-elevated border border-border rounded-xl p-2">
                  <input
                    placeholder="메시지를 입력하세요"
                    className="flex-1 bg-transparent px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  <button className="p-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                    <Send size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
