"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

const CATEGORY_TAGS = ["꿀팁", "단축키", "오류해결", "템플릿", "협업", "계약", "장비추천", "잡담", "기타"];

type BoardCategory = "INFO" | "FREE";

export default function CommunityWritePage() {
  const router = useRouter();
  const [category, setCategory] = useState<BoardCategory>("INFO");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

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
    const accessToken = localStorage.getItem("accessToken");
    if (!accessToken) {
      router.push("/login");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/posts/community`, {
        method: "POST",
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
      if (!res.ok) throw new Error("등록 실패");
      router.push("/community");
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/community"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            목록으로
          </Link>
          <h1 className="text-xl font-bold text-text-primary">글 작성</h1>
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
              onChange={setContent}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim()}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </div>
    </div>
  );
}
