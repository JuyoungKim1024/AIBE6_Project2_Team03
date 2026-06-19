"use client";

import React, { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ChevronDown, X } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { PostCard, PostType } from "@/components/post/PostCard";
import { fetchJobPosts, getLikedPostIds } from "@/lib/api/post";
import { JobPostDto } from "@/types/post";
import { API_BASE_URL } from "@/lib/api";
import { formatTimeAgo } from "@/lib/utils/time";

type JobType = "hiring" | "looking";

const categoryChips = ["롱폼", "숏폼", "썸네일"];
const subCategoryChips = ["게임", "여행", "브이로그", "반려동물", "음악", "IT", "애니메이션", "기타"];
const videoToolChips = ["Premiere Pro", "Final Cut Pro", "DaVinci Resolve", "CapCut", "기타"];
const designToolChips = ["Photoshop", "Adobe Illustrator", "Figma", "Canva", "기타"];

function JobsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  const tabParam = searchParams.get("tab") as JobType | null;

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<JobType>(tabParam === "looking" ? "looking" : "hiring");
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState("latest");
  const [jobs, setJobs] = useState<JobPostDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    getLikedPostIds().then((ids) => setLikedIds(new Set(ids))).catch(() => {});
    const token = localStorage.getItem("accessToken");
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then((r) => r.ok ? r.json() : null)
        .then((user) => user && setCurrentUserId(user.id))
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    const postType = activeTab === "hiring" ? "RECRUITING" : "JOB_SEARCH";
    setLoading(true);
    fetchJobPosts(postType)
      .then(setJobs)
      .catch((err) => console.error("fetchJobPosts error:", err))
      .finally(() => setLoading(false));
  }, [activeTab]);

  const toggleFilter = (group: string, chip: string) => {
    const key = `${group}:${chip}`;
    setActiveFilters((prev) =>
      prev.includes(key) ? prev.filter((f) => f !== key) : [...prev, key],
    );
  };

  const fieldFilterValues = activeFilters
    .filter((f) => f.startsWith("분야:") || f.startsWith("세부분야:"))
    .map((f) => f.split(":")[1]);
  const toolFilterValues = activeFilters
    .filter((f) => f.startsWith("영상편집툴:") || f.startsWith("디자인툴:"))
    .map((f) => f.split(":")[1]);

  const filteredJobs = jobs
    .filter((j) => {
      const matchesField =
        fieldFilterValues.length === 0 ||
        j.fieldTags.some((t) => fieldFilterValues.includes(t));
      const matchesTool =
        toolFilterValues.length === 0 ||
        j.toolTags.some((t) => toolFilterValues.includes(t));
      const matchesFilter = matchesField && matchesTool;
      const matchesQuery =
        query === "" ||
        j.title.includes(query) ||
        j.fieldTags.some((t) => t.includes(query)) ||
        j.toolTags.some((t) => t.includes(query)) ||
        j.author.nickname.includes(query);
      return matchesFilter && matchesQuery;
    })
    .sort((a, b) => {
      // 단가 미공개는 항상 하위
      if (a.priceVisible !== b.priceVisible) return a.priceVisible ? -1 : 1;
      if (sort === "popular") return b.likeCount - a.likeCount;
      if (sort === "price") return (b.minPrice ?? 0) - (a.minPrice ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">구인구직</h1>
            {query ? (
              <p className="text-text-secondary text-sm">
                <span className="text-primary font-medium">"{query}"</span> 검색 결과 {filteredJobs.length}건
              </p>
            ) : (
              <p className="text-text-secondary text-sm">검증된 크리에이터와 에디터가 만나는 곳</p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="appearance-none bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer"
              >
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="price">단가높은순</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
            <button
              onClick={() => {
                if (!localStorage.getItem("accessToken")) { router.push("/login"); return; }
                router.push("/jobs/write");
              }}
              className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap"
            >
              <Plus size={16} />글쓰기
            </button>
          </div>
        </div>
        <div className="flex border-b border-border mb-6">
          {[
            {
              id: "hiring" as const,
              label: "구인",
              labelSub: "Hiring",
              color: "text-accent",
            },
            {
              id: "looking" as const,
              label: "구직",
              labelSub: "Looking for Work",
              color: "text-primary",
            },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-4 sm:px-6 py-4 text-sm font-bold transition-colors whitespace-nowrap ${isActive ? "text-text-primary" : "text-text-secondary hover:text-text-primary"}`}
              >
                <span>{tab.label}</span>
                <span className="hidden sm:inline text-text-muted font-normal"> ({tab.labelSub})</span>
                {isActive && (
                  <motion.div
                    layoutId="jobTabIndicator"
                    className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.id === "hiring" ? "bg-accent" : "bg-primary"}`}
                  />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-3 mb-6">
          {/* Filter header */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-surface text-xs font-bold text-text-secondary hover:border-text-muted transition-colors flex-shrink-0"
            >
              <ChevronDown size={13} className={`transition-transform ${filterOpen ? "rotate-180" : ""}`} />
              필터
              {activeFilters.length > 0 && (
                <span className="ml-0.5 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                  {activeFilters.length}
                </span>
              )}
            </button>
            {activeFilters.length > 0 && (
              <>
                <div className="flex gap-1.5 flex-wrap">
                  {activeFilters.map((f) => {
                    const [group, chip] = f.split(":");
                    return (
                      <button
                        key={f}
                        onClick={() => toggleFilter(group, chip)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 border border-primary/50 text-primary"
                      >
                        <span className="text-primary/60">{group}</span>
                        <span className="text-primary/40">·</span>
                        {chip}
                        <X size={10} />
                      </button>
                    );
                  })}
                </div>
                <button
                  onClick={() => setActiveFilters([])}
                  className="text-xs text-text-muted hover:text-text-primary transition-colors"
                >
                  초기화
                </button>
              </>
            )}
          </div>
          {/* Filter groups */}
          {filterOpen && (
            <div className="flex flex-col gap-3 p-4 bg-surface border border-border rounded-xl">
              {[
                { label: "분야", chips: categoryChips },
                { label: "세부분야", chips: subCategoryChips },
                { label: "영상편집툴", chips: videoToolChips },
                { label: "디자인툴", chips: designToolChips },
              ].map(({ label, chips }) => (
                <div key={label} className="flex items-start gap-3">
                  <span className="text-xs font-bold text-text-muted w-16 flex-shrink-0 pt-1.5">{label}</span>
                  <div className="flex gap-2 flex-wrap">
                    {chips.map((chip) => {
                      const isActive = activeFilters.includes(`${label}:${chip}`);
                      return (
                        <button
                          key={`${label}-${chip}`}
                          onClick={() => toggleFilter(label, chip)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${isActive ? "bg-primary/10 border-primary/50 text-primary" : "bg-surface-elevated border-border text-text-secondary hover:border-text-muted"}`}
                        >
                          {chip}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="space-y-4">
          {loading ? (
            <p className="text-center text-text-muted py-20 text-sm">
              불러오는 중...
            </p>
          ) : filteredJobs.length === 0 ? (
            <p className="text-center text-text-muted py-20 text-sm">
              게시물이 없습니다.
            </p>
          ) : (
            filteredJobs.map((job, i) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
              >
                <PostCard
                  id={job.id}
                  linkTo={`/jobs/${job.id}`}
                  type={activeTab as PostType}
                  title={job.title}
                  author={{ id: job.author.id, name: job.author.nickname, avatar: job.author.profileImage ?? undefined }}
                  categoryTags={job.fieldTags}
                  toolTags={job.toolTags}
                  minPrice={job.minPrice ?? undefined}
                  maxPrice={job.maxPrice ?? undefined}
                  priceHidden={!job.priceVisible}
                  likes={job.likeCount}
                  comments={job.commentCount}
                  views={job.viewCount}
                  timeAgo={formatTimeAgo(job.createdAt)}
                  thumbnail={job.thumbnailUrl ?? undefined}
                  initialLiked={likedIds.has(job.id)}
                  isOwn={!!currentUserId && job.author.id === currentUserId}
                />
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-text-muted text-sm">
          불러오는 중...
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
