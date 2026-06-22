"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { getAccessToken } from "@/lib/auth-session";

const CATEGORY_TAGS = ["꿀팁", "단축키", "오류해결", "템플릿", "협업", "계약", "장비추천", "잡담", "기타"];

type BoardCategory = "INFO" | "FREE";

function CommunityWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = !!editId;

  const [category, setCategory] = useState<BoardCategory>("INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [loadingPost, setLoadingPost] = useState(isEditMode);

  useEffect(() => {
    if (!editId) return;
    const token = getAccessToken();
    if (!token) { router.push("/login"); return; }
    fetch(`${API_BASE_URL}/api/posts/community/${editId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        setCategory(data.category as BoardCategory);
        setTitle(data.title);
        setContent(data.content);
        setSelectedTags(data.tags ?? []);
      })
      .catch(console.error)
      .finally(() => setLoadingPost(false));
  }, [editId, router]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const extractThumbnailUrl = (html: string): string | null => {
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    return match?.[1] ?? null;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    const accessToken = getAccessToken();
    if (!accessToken) { router.push("/login"); return; }
    setSubmitting(true);
    try {
      const url = isEditMode
        ? `${API_BASE_URL}/api/posts/community/${editId}`
        : `${API_BASE_URL}/api/posts/community`;
      const res = await fetch(url, {
        method: isEditMode ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          category,
          title,
          content,
          thumbnailUrl: extractThumbnailUrl(content),
          tags: selectedTags,
        }),
      });
      if (!res.ok) throw new Error(isEditMode ? "수정 실패" : "등록 실패");
      router.push(isEditMode ? `/community/${editId}` : "/community");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingPost) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-text-muted text-sm">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={isEditMode ? `/community/${editId}` : "/community"}
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            {isEditMode ? "돌아가기" : "목록으로"}
          </Link>
          <h1 className="text-xl font-bold text-text-primary">
            {isEditMode ? "글 수정" : "글 작성"}
          </h1>
          <div className="w-20" />
        </div>

        <div className="space-y-8">
          {/* 게시판 선택 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              게시판
            </label>
            <div className="flex bg-surface-elevated p-1 rounded-xl border border-border w-full sm:w-64">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  className="peer sr-only"
                  checked={category === "INFO"}
                  onChange={() => setCategory("INFO")}
                />
                <div className="py-2.5 text-center text-sm font-bold rounded-lg text-text-secondary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  정보공유
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="category"
                  className="peer sr-only"
                  checked={category === "FREE"}
                  onChange={() => setCategory("FREE")}
                />
                <div className="py-2.5 text-center text-sm font-bold rounded-lg text-text-secondary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  자유게시판
                </div>
              </label>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              제목 <span className="text-accent">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력해주세요"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 태그 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              태그
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORY_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    selectedTags.includes(tag)
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-surface border-border text-text-secondary hover:border-text-muted"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              내용 <span className="text-accent">*</span>
            </label>
            <RichTextEditor
              placeholder="내용을 입력해주세요."
              value={content}
              onChange={setContent}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (isEditMode ? "수정 중..." : "등록 중...") : (isEditMode ? "수정하기" : "등록하기")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CommunityWritePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted text-sm">불러오는 중...</div>}>
      <CommunityWriteContent />
    </Suspense>
  );
}
