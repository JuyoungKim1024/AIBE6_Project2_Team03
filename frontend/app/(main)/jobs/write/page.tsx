"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, AlertCircle, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { fetchJobPost } from "@/lib/api/post";

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

function JobsWriteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");

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
  const [revisionCount, setRevisionCount] = useState<number | null>(null);
  const [customRevisionInput, setCustomRevisionInput] = useState("");
  const [unlimitedRevision, setUnlimitedRevision] = useState(false);
  const [revisionError, setRevisionError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editorReady, setEditorReady] = useState(false);
  const [originalSnapshot, setOriginalSnapshot] = useState<string | null>(null);
  const priceRangeError = !priceHidden && minPrice > maxPrice;

  const isDirty = !editId || originalSnapshot === null || originalSnapshot !== JSON.stringify({
    title,
    content,
    type,
    minPrice,
    maxPrice,
    priceHidden,
    unlimitedRevision,
    revisionCount,
    selectedCategory: [...selectedCategory].sort(),
    selectedSubCategory: [...selectedSubCategory].sort(),
    selectedVideoTools: [...selectedVideoTools].sort(),
    selectedDesignTools: [...selectedDesignTools].sort(),
    selectedPortfolioId,
  });
  const priceSectionRef = useRef<HTMLDivElement>(null);
  const revisionSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const cachedRole = localStorage.getItem("userRole") as UserRole | null;

    if (cachedRole) {
      setUserRole(cachedRole);
      if (!editId) setType(cachedRole === "YOUTUBER" ? "hiring" : "looking");
    }

    if (!token) {
      if (!editId) setEditorReady(true);
      return;
    }

    if (cachedRole === "EDITOR") {
      fetch(`${API_BASE_URL}/api/users/me/portfolios`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.ok ? r.json() : [])
        .then(setPortfolios)
        .catch(() => {});
    }

    if (editId) {
      fetchJobPost(editId)
        .then((post) => {
          const postType = post.postType === "RECRUITING" ? "hiring" : "looking";
          const fetchedMinPrice = post.minPrice ?? 10000;
          const fetchedMaxPrice = post.maxPrice ?? 20000;
          const fetchedPriceHidden = !post.priceVisible;
          const fetchedCategory = post.fieldTags.filter((t) => categoryTags.includes(t));
          const fetchedSubCategory = post.fieldTags.filter((t) => subCategoryTags.includes(t));
          const fetchedVideoTools = post.toolTags.filter((t) => videoToolTags.includes(t));
          const fetchedDesignTools = post.toolTags.filter((t) => designToolTags.includes(t));
          const fetchedPortfolioId = post.portfolioId ?? null;
          const fetchedUnlimited = post.revisionCount === null;
          const fetchedRevisionCount = post.revisionCount;

          setTitle(post.title);
          setContent(post.content);
          setType(postType);
          setMinPrice(fetchedMinPrice);
          setMaxPrice(fetchedMaxPrice);
          setPriceHidden(fetchedPriceHidden);
          setSelectedCategory(fetchedCategory);
          setSelectedSubCategory(fetchedSubCategory);
          setSelectedVideoTools(fetchedVideoTools);
          setSelectedDesignTools(fetchedDesignTools);
          setSelectedPortfolioId(fetchedPortfolioId);
          if (fetchedUnlimited) {
            setUnlimitedRevision(true);
          } else {
            setRevisionCount(fetchedRevisionCount);
            if (fetchedRevisionCount !== null && ![0, 1, 2, 3, 5, 10].includes(fetchedRevisionCount)) {
              setCustomRevisionInput(String(fetchedRevisionCount));
            }
          }

          setOriginalSnapshot(JSON.stringify({
            title: post.title,
            content: post.content,
            type: postType,
            minPrice: fetchedMinPrice,
            maxPrice: fetchedMaxPrice,
            priceHidden: fetchedPriceHidden,
            unlimitedRevision: fetchedUnlimited,
            revisionCount: fetchedRevisionCount,
            selectedCategory: [...fetchedCategory].sort(),
            selectedSubCategory: [...fetchedSubCategory].sort(),
            selectedVideoTools: [...fetchedVideoTools].sort(),
            selectedDesignTools: [...fetchedDesignTools].sort(),
            selectedPortfolioId: fetchedPortfolioId,
          }));
        })
        .catch(console.error)
        .finally(() => setEditorReady(true));
    } else {
      setEditorReady(true);
    }
  }, [editId]);

  const handleTypeChange = (next: "hiring" | "looking") => {
    if (!userRole) return;
    if (userRole === "YOUTUBER" && next === "looking") {
      setRoleError("유튜버 계정으로는 구직 글을 작성할 수 없습니다. 에디터 계정으로 변경해주세요.");
      return;
    }
    if (userRole === "EDITOR" && next === "hiring") {
      setRoleError("에디터 계정으로는 구인 글을 작성할 수 없습니다. 유튜버 계정으로 변경해주세요.");
      return;
    }
    setRoleError(null);
    setType(next);
  };

  const toggle = (tag: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };

  const extractThumbnailUrl = (html: string): string | null => {
    const match = html.match(/<img[^>]+src="([^"]+)"/);
    return match?.[1] ?? null;
  };

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim() || !type) return;
    if (!editId && userRole === "EDITOR" && type === "hiring") return;
    if (!editId && userRole === "YOUTUBER" && type === "looking") return;
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
    const toolTags = [
      ...selectedVideoTools.filter((t) => t !== "기타"),
      ...selectedDesignTools.filter((t) => t !== "기타"),
      ...(selectedVideoTools.includes("기타") || selectedDesignTools.includes("기타") ? ["기타"] : []),
    ];
    const commonFields = {
      title,
      content,
      thumbnailUrl: extractThumbnailUrl(content),
      minPrice: priceHidden ? null : minPrice,
      maxPrice: priceHidden ? null : maxPrice,
      priceVisible: !priceHidden,
      fieldTags: [...selectedCategory, ...selectedSubCategory],
      toolTags,
      revisionCount: unlimitedRevision ? null : revisionCount,
    };
    const body = editId
      ? JSON.stringify(commonFields)
      : JSON.stringify({ ...commonFields, postType: type === "hiring" ? "RECRUITING" : "JOB_SEARCH", portfolioId: selectedPortfolioId });
    try {
      const url = editId
        ? `${API_BASE_URL}/api/posts/job/${editId}`
        : `${API_BASE_URL}/api/posts/job`;
      console.log("[submit]", editId ? "PATCH" : "POST", url, JSON.parse(body));
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body,
      });
      console.log("[submit] status:", res.status);
      if (!res.ok) {
        const errText = await res.text();
        console.error("[submit] error body:", errText);
        alert(`저장 실패 (${res.status}): ${errText}`);
        return;
      }
      if (editId) {
        router.push(`/jobs/${editId}`);
      } else {
        const result = await res.json();
        router.push(`/jobs/${result.id}`);
      }
    } catch (err) {
      console.error("[submit] exception:", err);
      alert("요청 중 오류가 발생했습니다. 콘솔을 확인해주세요.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pb-32">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link
            href={editId ? `/jobs/${editId}` : "/jobs"}
            className="inline-flex items-center gap-1.5 text-text-secondary hover:text-text-primary text-sm font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            {editId ? "상세로" : "목록으로"}
          </Link>
          <h1 className="text-xl font-bold text-text-primary">
            {editId ? "글 수정" : "글 작성"}
          </h1>
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
                {priceRangeError && (
                  <div className="flex items-start gap-2 text-red-400 text-xs font-medium bg-red-400/10 p-3 rounded-lg mb-3">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>최대 금액이 최소 금액보다 낮을 수 없습니다.</span>
                  </div>
                )}
                <div className="text-center font-mono text-primary font-bold">
                  ₩{new Intl.NumberFormat("ko-KR").format(minPrice)} ~ ₩{new Intl.NumberFormat("ko-KR").format(maxPrice)}
                  <span className="font-sans text-sm font-normal text-text-muted">/분</span>
                </div>
              </div>
            )}
          </div>

          {/* 수정 횟수 */}
          <div ref={revisionSectionRef} className="bg-surface border border-border rounded-xl p-6">
            <label className="block text-sm font-bold text-text-primary mb-4">수정 횟수</label>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => { setRevisionCount(0); setCustomRevisionInput(""); setUnlimitedRevision(false); setRevisionError(false); }}
                className={`px-3 h-10 rounded-lg text-sm font-bold border transition-all ${revisionCount === 0 && !unlimitedRevision && customRevisionInput === "" ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface-elevated border-border text-text-secondary hover:border-text-muted"}`}
              >
                없음
              </button>
              {[1, 2, 3, 5, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => { setRevisionCount(n); setCustomRevisionInput(""); setUnlimitedRevision(false); setRevisionError(false); }}
                  className={`w-12 h-10 rounded-lg text-sm font-bold border transition-all ${revisionCount === n && !unlimitedRevision && customRevisionInput === "" ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface-elevated border-border text-text-secondary hover:border-text-muted"}`}
                >
                  {n}회
                </button>
              ))}
              <div className={`flex items-center gap-1.5 bg-surface-elevated border rounded-lg px-3 h-10 transition-colors ${revisionError ? "border-accent/60 focus-within:border-accent" : "border-border focus-within:border-primary"}`}>
                <input
                  type="number"
                  min={0}
                  placeholder="직접"
                  value={customRevisionInput}
                  onChange={(e) => {
                    const raw = e.target.value;
                    setCustomRevisionInput(raw);
                    setUnlimitedRevision(false);
                    const v = Number(raw);
                    if (raw === "") {
                      setRevisionCount(null);
                      setRevisionError(false);
                    } else if (v >= 0) {
                      setRevisionCount(v);
                      setRevisionError(false);
                    } else {
                      setRevisionCount(null);
                      setRevisionError(true);
                    }
                  }}
                  onBlur={() => {
                    if (customRevisionInput !== "" && Number(customRevisionInput) < 0) {
                      setRevisionError(true);
                    }
                  }}
                  className="w-12 bg-transparent text-sm text-text-primary font-mono focus:outline-none"
                />
                <span className="text-sm text-text-muted">회</span>
              </div>
              <button
                type="button"
                onClick={() => { setUnlimitedRevision(true); setRevisionCount(null); setCustomRevisionInput(""); setRevisionError(false); }}
                className={`px-3 h-10 rounded-lg text-sm font-bold border transition-all ${unlimitedRevision ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface-elevated border-border text-text-secondary hover:border-text-muted"}`}
              >
                무제한
              </button>
            </div>
            {revisionError && (
              <p className="mt-2 text-xs text-accent font-medium">0 이상의 숫자로 입력해주세요.</p>
            )}
            <p className="mt-3 text-xs text-text-muted">미설정 시 협의 가능으로 표시됩니다.</p>
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
                  <Link href="/profile" className="text-xs text-primary hover:underline">
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
                        <img src={p.url} alt={p.title} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
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
            {editorReady ? (
              <RichTextEditor
                key={editId ?? "new"}
                value={content}
                placeholder="상세한 작업 조건, 우대 사항 등을 적어주세요."
                onChange={setContent}
              />
            ) : (
              <div className="bg-surface border border-border rounded-xl h-[300px] animate-pulse" />
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting || !title.trim() || !content.trim() || !isDirty}
            className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg hover:bg-primary/90 transition-colors shadow-[0_0_20px_rgba(59,130,246,0.2)] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (editId ? "수정 중..." : "등록 중...") : (editId ? "수정하기" : "등록하기")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobsWritePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="text-text-muted text-sm">불러오는 중...</div></div>}>
      <JobsWriteContent />
    </React.Suspense>
  );
}
