"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Paperclip, EyeOff } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

const contentTags = ["롱폼", "숏폼", "게임", "음악", "브이로그", "Shorts"];
const toolTags = ["Premiere Pro", "Final Cut", "After Effects", "DaVinci Resolve"];

export default function JobsWritePage() {
  const router = useRouter();

  const [type, setType] = useState<"hiring" | "looking">("hiring");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [minPrice, setMinPrice] = useState(10000);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [priceHidden, setPriceHidden] = useState(false);
  const [selectedContentTags, setSelectedContentTags] = useState<string[]>([]);
  const [selectedToolTags, setSelectedToolTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const toggleTag = (tag: string, kind: "content" | "tool") => {
    if (kind === "content") {
      setSelectedContentTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    } else {
      setSelectedToolTags((prev) =>
        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
      );
    }
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
      const res = await fetch(`${API_BASE_URL}/api/posts/job`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          postType: type === "hiring" ? "RECRUITING" : "JOB_SEARCH",
          title,
          content,
          minPrice: priceHidden ? null : minPrice,
          maxPrice: priceHidden ? null : maxPrice,
          priceVisible: !priceHidden,
          fieldTags: selectedContentTags,
          toolTags: selectedToolTags,
        }),
      });
      if (!res.ok) throw new Error("등록 실패");
      router.push("/jobs");
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
            href="/jobs"
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            목록으로
          </Link>
          <h1 className="text-xl font-bold text-text-primary">글 작성</h1>
          <div className="w-20" />
        </div>

        <div className="space-y-8">
          {/* 게시글 종류 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              게시글 종류
            </label>
            <div className="flex bg-surface-elevated p-1 rounded-xl border border-border w-full sm:w-64">
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  className="peer sr-only"
                  checked={type === "hiring"}
                  onChange={() => setType("hiring")}
                />
                <div className="py-2.5 text-center text-sm font-bold rounded-lg text-text-secondary peer-checked:bg-accent/10 peer-checked:text-accent peer-checked:shadow-sm transition-all">
                  구인 (Hiring)
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  className="peer sr-only"
                  checked={type === "looking"}
                  onChange={() => setType("looking")}
                />
                <div className="py-2.5 text-center text-sm font-bold rounded-lg text-text-secondary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                  구직 (Looking)
                </div>
              </label>
            </div>
          </div>

          {/* 제목 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              제목
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="직관적인 제목을 입력해주세요"
              className="w-full bg-surface border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            />
          </div>

          {/* 단가 */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-text-primary">
                희망 단가 (분당) <span className="text-accent">*</span>
              </label>
              <button
                onClick={() => setPriceHidden(!priceHidden)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${priceHidden ? "bg-primary/10 text-primary" : "bg-surface-elevated text-text-secondary hover:text-text-primary"}`}
              >
                <EyeOff size={16} />
                단가 미공개
              </button>
            </div>

            {priceHidden ? (
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center rounded-full bg-surface border border-transparent px-3 py-1 text-text-secondary opacity-70 text-sm font-medium w-max">
                  단가 미공개
                </div>
                <div className="flex items-start gap-2 text-amber-500 text-xs font-medium bg-amber-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>단가를 비공개로 설정하면 검색 결과에서 후순위로 노출됩니다.</span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 flex items-center bg-surface-elevated border border-border rounded-xl px-4 py-3">
                    <span className="text-text-muted mr-2">최소</span>
                    <span className="text-text-secondary font-medium mr-1">₩</span>
                    <input
                      type="number"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full bg-transparent text-text-primary font-mono focus:outline-none"
                    />
                  </div>
                  <span className="text-text-muted">~</span>
                  <div className="flex-1 flex items-center bg-surface-elevated border border-border rounded-xl px-4 py-3">
                    <span className="text-text-muted mr-2">최대</span>
                    <span className="text-text-secondary font-medium mr-1">₩</span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full bg-transparent text-text-primary font-mono focus:outline-none"
                    />
                  </div>
                </div>
                <div className="text-center font-mono text-primary font-bold">
                  ₩{new Intl.NumberFormat("ko-KR").format(minPrice)} ~ ₩
                  {new Intl.NumberFormat("ko-KR").format(maxPrice)}
                  <span className="font-sans text-sm font-normal text-text-muted">/분</span>
                </div>
              </div>
            )}
          </div>

          {/* 태그 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-3">분야 태그</label>
              <div className="flex flex-wrap gap-2">
                {contentTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag, "content")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedContentTags.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-3">툴 태그</label>
              <div className="flex flex-wrap gap-2">
                {toolTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag, "tool")}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedToolTags.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 포트폴리오 (구직만) */}
          {type === "looking" && (
            <div>
              <label className="block text-sm font-bold text-text-primary mb-3">
                포트폴리오 첨부
              </label>
              <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-text-muted hover:border-primary/50 hover:text-primary transition-colors cursor-pointer bg-surface-elevated/30">
                <Paperclip size={24} className="mb-3" />
                <span className="text-sm font-medium mb-1">클릭하여 파일 업로드 또는 링크 입력</span>
                <span className="text-xs opacity-70">동영상 링크(유튜브) 및 이미지 파일 지원</span>
              </div>
            </div>
          )}

          {/* 내용 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              내용
            </label>
            <RichTextEditor
              placeholder="상세한 작업 조건, 우대 사항 등을 적어주세요."
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
