'use client';

import { getAccessToken } from '@/lib/auth-session';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { WritePostModal } from '@/components/post/WritePostModal';
import { fetchCommunityPosts, getLikedPostIds } from '@/lib/api/post';
import { API_BASE_URL } from '@/lib/api';
import { CommunityPostDto } from '@/types/post';
import { formatTimeAgo } from '@/lib/utils/time';
import type { PostType } from '@/components/post/PostCard';

const categories = [
  { id: 'all', label: '📢 전체', dot: 'bg-text-primary' },
  { id: 'info', label: '📋 정보공유', dot: 'bg-cyan-400' },
  { id: 'free', label: '💬 자유게시판', dot: 'bg-text-secondary' },
];

const TAGS = ["꿀팁", "단축키", "오류해결", "템플릿", "협업", "계약", "장비추천", "잡담", "기타"];

function CommunityContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.get('q') ?? '';

  const [activeCategory, setActiveCategory] = useState(() => {
    if (typeof window === 'undefined') return 'all';
    const saved = sessionStorage.getItem('community_category');
    if (saved) { sessionStorage.removeItem('community_category'); return saved; }
    return 'all';
  });
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const pageRestoredRef = useRef(false);
  const [page, setPage] = useState(() => {
    if (typeof window === 'undefined') return 1;
    const saved = sessionStorage.getItem('community_page');
    if (saved) {
      sessionStorage.removeItem('community_page');
      pageRestoredRef.current = true;
      return parseInt(saved, 10);
    }
    return 1;
  });
  const PAGE_SIZE = 5;

  const toggleTag = (tag: string) => {
    setPage(1);
    setSelectedTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  };
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [posts, setPosts] = useState<CommunityPostDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [trendingPosts, setTrendingPosts] = useState<CommunityPostDto[]>([]);

  const calcTrendingScore = (post: CommunityPostDto) => {
    const hoursSince = (Date.now() - new Date(post.createdAt).getTime()) / 3600000;
    return post.viewCount / Math.pow(hoursSince + 1, 1.5);
  };

  useEffect(() => {
    const savedScroll = sessionStorage.getItem('community_scroll');
    if (savedScroll) {
      sessionStorage.removeItem('community_scroll');
      setTimeout(() => window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' }), 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
    getLikedPostIds().then((ids) => setLikedIds(new Set(ids))).catch(() => {});
    const token = getAccessToken();
    if (token) {
      fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((user) => user && setCurrentUserId(user.id))
        .catch(() => {});
    }
    Promise.all([fetchCommunityPosts('INFO'), fetchCommunityPosts('FREE')])
      .then(([info, free]) => {
        const all = [...info, ...free];
        setTrendingPosts(all.sort((a, b) => calcTrendingScore(b) - calcTrendingScore(a)).slice(0, 5));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isModalOpen) window.scrollTo({ top: 0, behavior: 'instant' });
  }, [isModalOpen]);

  useEffect(() => {
    setLoading(true);
    if (pageRestoredRef.current) {
      pageRestoredRef.current = false;
    } else {
      setPage(1);
    }
    const request =
      activeCategory === 'all'
        ? Promise.all([fetchCommunityPosts('INFO'), fetchCommunityPosts('FREE')]).then(
            ([info, free]) => [...info, ...free],
          )
        : fetchCommunityPosts(activeCategory.toUpperCase() as 'INFO' | 'FREE');

    request
      .then(setPosts)
      .catch((err) => console.error('fetchCommunityPosts error:', err))
      .finally(() => setLoading(false));
  }, [activeCategory]);

  const filteredPosts = posts
    .filter((p) => {
      const matchesQuery =
        query === '' ||
        p.title.includes(query) ||
        p.author.nickname.includes(query);
      const matchesTags =
        selectedTags.length === 0 ||
        selectedTags.some((t) => p.tags.includes(t));
      return matchesQuery && matchesTags;
    })
    .sort((a, b) => {
      if (sort === 'popular') return b.likeCount - a.likeCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedPosts = filteredPosts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-text-primary mb-1">커뮤니티</h1>
            {query ? (
              <p className="text-text-secondary text-sm">
                <span className="text-primary font-medium">"{query}"</span> 검색 결과 {filteredPosts.length}건
              </p>
            ) : (
              <p className="text-text-secondary text-sm">에디터와 크리에이터가 함께하는 정보 공유 공간</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-elevated p-1 rounded-lg border border-border">
              {[{ id: 'latest', label: '최신순' }, { id: 'popular', label: '인기순' }].map((opt) => (
                <button key={opt.id} onClick={() => { setSort(opt.id as 'latest' | 'popular'); setPage(1); }} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === opt.id ? 'bg-surface text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                if (!getAccessToken()) { router.push("/login"); return; }
                sessionStorage.setItem('community_page', String(safePage));
                sessionStorage.setItem('community_scroll', String(window.scrollY));
                router.push("/community/write");
              }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]"
            >
              <Plus size={16} />글쓰기
            </button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 border-b border-border">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap rounded-lg transition-all flex items-center gap-2 ${isActive ? 'bg-surface-elevated text-text-primary font-bold' : 'text-text-secondary hover:text-text-primary'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${cat.dot} ${isActive ? 'opacity-100' : 'opacity-50'}`} />
                {cat.label}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 flex-wrap py-3 mb-2">
          {TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${selectedTags.includes(tag) ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-surface-elevated border-border text-text-secondary hover:border-text-muted'}`}
            >
              #{tag}
            </button>
          ))}
        </div>
        <div className="flex flex-col lg:flex-row gap-8 mt-6">
          <main className="flex-1 min-w-0 space-y-4">
            {loading ? (
              <p className="text-center text-text-muted py-20 text-sm">불러오는 중...</p>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 text-text-muted">조건에 맞는 게시글이 없습니다.</div>
            ) : (
              <>
                {pagedPosts.map((post, i) => (
                  <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }} onClick={() => { sessionStorage.setItem('community_page', String(safePage)); sessionStorage.setItem('community_scroll', String(window.scrollY)); sessionStorage.setItem('community_category', activeCategory); }}>
                    <PostCard
                      id={post.id}
                      linkTo={`/community/${post.id}`}
                      type={post.category.toLowerCase() as PostType}
                      title={post.title}
                      author={{ id: post.author.id, name: post.author.nickname, avatar: post.author.profileImage ?? undefined, rank: post.author.rank }}
                      categoryTags={post.tags}
                      toolTags={[]}
                      likes={post.likeCount}
                      comments={post.commentCount}
                      views={post.viewCount}
                      timeAgo={formatTimeAgo(post.createdAt)}
                      thumbnail={post.thumbnailUrl ?? undefined}
                      initialLiked={likedIds.has(post.id)}
                      isOwn={currentUserId === post.author.id}
                    />
                  </motion.div>
                ))}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-8">
                    <button
                      onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={safePage === 1}
                      className="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      ←
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${p === safePage ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated'}`}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                      disabled={safePage === totalPages}
                      className="px-3 py-1.5 rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
          <aside className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-base font-bold text-text-primary mb-4">지금 뜨는 글 🔥</h3>
              <div className="space-y-3">
                {trendingPosts.map((post, i) => (
                  <a key={post.id} href={`/community/${post.id}`} className="flex items-start gap-3 group">
                    <span className={`text-sm font-bold mt-0.5 ${i < 3 ? 'text-primary' : 'text-text-muted'}`}>{i + 1}</span>
                    <p className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors">{post.title}</p>
                  </a>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
      <WritePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default function CommunityPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted text-sm">불러오는 중...</div>}>
      <CommunityContent />
    </Suspense>
  );
}
