"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

const categoryTags = ["롱폼", "숏폼", "썸네일"];
const subCategoryTags = ["게임", "여행", "브이로그", "반려동물", "IT", "애니메이션", "기타"];
const videoToolTags = ["Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "CapCut", "기타"];
const designToolTags = ["Photoshop", "Adobe Illustrator", "Figma", "Canva", "기타"];

type UserRole = "YOUTUBER" | "EDITOR";

interface PortfolioItem {
  id: string;
  title: string;
  url: string;
  type: string;
  representative: boolean;
}

export default function JobsWritePage() {
  const router = useRouter();

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [roleError, setRoleError] = useState<string | null>(null);
  const [type, setType] = useState<"hiring" | "looking" | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [minPrice, setMinPrice] = useState(10000);
  const [maxPrice, setMaxPrice] = useState(20000);
  const [priceHidden, setPriceHidden] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string[]>([]);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string[]>([]);
  const [selectedVideoTools, setSelectedVideoTools] = useState<string[]>([]);
  const [selectedDesignTools, setSelectedDesignTools] = useState<string[]>([]);
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([]);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const priceRangeError = !priceHidden && minPrice > maxPrice;
  const priceSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return;
    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((user) => {
        if (!user?.role) return;
        const role = user.role as UserRole;
        setUserRole(role);
        setType(role === "YOUTUBER" ? "hiring" : "looking");
        if (role === "EDITOR") {
          fetch(`${API_BASE_URL}/api/users/me/portfolios`, {
            headers: { Authorization: `Bearer ${token}` },
          })
            .then((r) => r.ok ? r.json() : [])
            .then(setPortfolios)
            .catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  const handleTypeChange = (next: "hiring" | "looking") => {
    if (!userRole) return;
    if (userRole === "YOUTUBER" && next === "looking") {
      setRoleError(
        "유튜버 계정으로는 구직 글을 작성할 수 없습니다. 에디터 계정으로 변경해주세요.",
      );
      return;
    }
    if (userRole === "EDITOR" && next === "hiring") {
      setRoleError(
        "에디터 계정으로는 구인 글을 작성할 수 없습니다. 유튜버 계정으로 변경해주세요.",
      );
      return;
    }
    setRoleError(null);
    setType(next);
  };

  const toggle = (tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !type) return;
    if (userRole === "EDITOR" && type === "hiring") return;
    if (userRole === "YOUTUBER" && type === "looking") return;
    if (priceRangeError) {
      priceSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
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
          fieldTags: [...selectedCategory, ...selectedSubCategory],
          toolTags: [
            ...selectedVideoTools.filter((t) => t !== "기타"),
            ...selectedDesignTools.filter((t) => t !== "기타"),
            ...(selectedVideoTools.includes("기타") || selectedDesignTools.includes("기타") ? ["기타"] : []),
          ],
          portfolioId: selectedPortfolioId,
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
            {type === null ? (
              <div className="w-full sm:w-64 h-11 bg-surface-elevated border border-border rounded-xl animate-pulse" />
            ) : (
              <div className="flex bg-surface-elevated p-1 rounded-xl border border-border w-full sm:w-64">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="radio"
                    name="type"
                    className="peer sr-only"
                    checked={type === "hiring"}
                    onChange={() => handleTypeChange("hiring")}
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
                    onChange={() => handleTypeChange("looking")}
                  />
                  <div className="py-2.5 text-center text-sm font-bold rounded-lg text-text-secondary peer-checked:bg-primary/10 peer-checked:text-primary peer-checked:shadow-sm transition-all">
                    구직 (Looking)
                  </div>
                </label>
              </div>
            )}
            {roleError && (
              <div className="mt-3 flex items-start gap-2 text-amber-500 text-xs font-medium bg-amber-500/10 p-3 rounded-lg">
                <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                <span>{roleError}</span>
              </div>
            )}
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

          {/* 단가 */}
          <div ref={priceSectionRef} className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-bold text-text-primary">
                희망 단가 (분당) <span className="text-accent">*</span>
              </label>
              <button
                onClick={() => setPriceHidden(!priceHidden)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${priceHidden ? "bg-primary/10 text-primary" : "bg-surface-elevated text-text-secondary hover:text-text-primary"}`}
              >
                {priceHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                {priceHidden && "단가 미공개"}
              </button>
            </div>

            {priceHidden ? (
              <div className="flex flex-col gap-3">
                <div className="inline-flex items-center rounded-full bg-surface border border-transparent px-3 py-1 text-text-secondary opacity-70 text-sm font-medium w-max">
                  단가 미공개
                </div>
                <div className="flex items-start gap-2 text-amber-500 text-xs font-medium bg-amber-500/10 p-3 rounded-lg">
                  <AlertCircle size={16} className="flex-shrink-0" />
                  <span>
                    단가를 비공개로 설정하면 검색 결과에서 후순위로 노출됩니다.
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex-1 flex items-center bg-surface-elevated border border-border rounded-xl px-4 py-3">
                    <span className="text-text-muted mr-2">최소</span>
                    <span className="text-text-secondary font-medium mr-1">
                      ₩
                    </span>
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
                    <span className="text-text-secondary font-medium mr-1">
                      ₩
                    </span>
                    <input
                      type="number"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full bg-transparent text-text-primary font-mono focus:outline-none"
                    />
                  </div>
                </div>
                {priceRangeError && (
                  <div className="flex items-start gap-2 text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg mb-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>최대 금액이 최소 금액보다 낮을 수 없습니다.</span>
                  </div>
                )}
                <div className="text-center font-mono text-primary font-bold">
                  ₩{new Intl.NumberFormat("ko-KR").format(minPrice)} ~ ₩
                  {new Intl.NumberFormat("ko-KR").format(maxPrice)}
                  <span className="font-sans text-sm font-normal text-text-muted">
                    /분
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* 태그 */}
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">분야</label>
                <div className="flex flex-wrap gap-2">
                  {categoryTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggle(tag, setSelectedCategory)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedCategory.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">세부분야</label>
                <div className="flex flex-wrap gap-2">
                  {subCategoryTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggle(tag, setSelectedSubCategory)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedSubCategory.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">영상편집툴</label>
                <div className="flex flex-wrap gap-2">
                  {videoToolTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggle(tag, setSelectedVideoTools)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedVideoTools.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-text-primary mb-3">디자인툴</label>
                <div className="flex flex-wrap gap-2">
                  {designToolTags.map((tag) => (
                    <button key={tag} type="button" onClick={() => toggle(tag, setSelectedDesignTools)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedDesignTools.includes(tag) ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface border-border text-text-secondary hover:border-text-muted"}`}>
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 포트폴리오 (구직만) */}
          {type === "looking" && (
            <div>
              <label className="block text-sm font-bold text-text-primary mb-3">
                포트폴리오 선택
              </label>
              {portfolios.length === 0 ? (
                <div className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center justify-center text-text-muted bg-surface-elevated/30">
                  <span className="text-sm font-medium mb-2">등록된 포트폴리오가 없습니다.</span>
                  <Link
                    href="/profile"
                    className="text-xs text-primary hover:underline"
                  >
                    포트폴리오를 등록해서 이용해보세요 →
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {portfolios.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPortfolioId(selectedPortfolioId === p.id ? null : p.id)}
                      className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                        selectedPortfolioId === p.id
                          ? "border-primary bg-primary/10"
                          : "border-border bg-surface hover:border-text-muted"
                      }`}
                    >
                      {p.url && (
                        <img
                          src={p.url}
                          alt={p.title}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-text-primary truncate">{p.title}</div>
                        {p.representative && (
                          <div className="text-xs text-primary mt-0.5">대표 포트폴리오</div>
                        )}
                      </div>
                      {selectedPortfolioId === p.id && (
                        <CheckCircle2 size={18} className="text-primary flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 내용 */}
          <div>
            <label className="block text-sm font-bold text-text-primary mb-3">
              내용 <span className="text-accent">*</span>
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
