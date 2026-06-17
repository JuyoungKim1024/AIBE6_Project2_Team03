'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, MessageCircle, Star, Tag, User, Wrench } from 'lucide-react';
import { TrustTemperature } from '@/components/profile/TrustTemperature';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type Portfolio = {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  type?: 'video' | 'image';
  order: number;
};

type Review = {
  id: string;
  author: string;
  rating: number;
  content: string | null;
  date: string;
};

type Deal = {
  id: string;
  title: string;
  status: string;
  date: string;
};

type ProfilePost = {
  id: string;
  boardType: 'JOB' | 'COMMUNITY';
  postType: string | null;
  title: string;
  authorName: string;
  likes: number;
  comments: number;
  views: number;
  date: string;
};

type PublicProfile = {
  id: string;
  nickname: string;
  profileImage: string | null;
  role: 'YOUTUBER' | 'EDITOR' | null;
  fieldTags: string[];
  toolTags: string[];
  battlePower: number;
  portfolios: Portfolio[];
  reviews: Review[];
  recentDeals: Deal[];
  publicPostsVisible: boolean;
  publicJobPostsVisible: boolean;
  publicCommunityPostsVisible: boolean;
  publicLikedPostsVisible: boolean;
  posts?: ProfilePost[];
  likedPosts?: ProfilePost[];
};

const reviewsPerPage = 5;

const projectStatusLabel: Record<string, string> = {
  WAITING: '대기',
  WORKING: '작업 중',
  COMPLETED: '작업완료',
  REJECTED: '거절',
  CANCELED: '취소',
};

function RoleBadge({ role }: { role: PublicProfile['role'] }) {
  if (role === 'YOUTUBER') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-accent/10 text-accent text-xs font-bold">크리에이터</span>;
  }
  if (role === 'EDITOR') {
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold">에디터</span>;
  }
  return null;
}

function ProfilePostSection({ title, posts, emptyMessage }: { title: string; posts: ProfilePost[]; emptyMessage: string }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <h2 className="text-xl font-bold text-text-primary">{title}</h2>
        <span className="text-sm text-text-muted">{posts.length}개</span>
      </div>
      {posts.length > 0 ? <div className="space-y-3">
        {posts.map((post) => (
          <Link key={post.id} href={post.boardType === 'JOB' ? `/jobs/${post.id}` : `/community/${post.id}`} className="block rounded-xl bg-surface-elevated border border-border p-4 hover:border-primary/50 transition-colors">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${post.boardType === 'JOB' ? 'bg-accent/10 text-accent' : 'bg-cyan-400/10 text-cyan-400'}`}>
                {post.boardType === 'JOB' ? (post.postType === 'RECRUITING' ? '구인글' : '구직글') : '커뮤니티글'}
              </span>
              <span className="text-xs text-text-muted">{post.authorName}</span>
              <span className="text-xs text-text-muted">·</span>
              <span className="text-xs text-text-muted">{post.date}</span>
            </div>
            <h3 className="font-bold text-text-primary">{post.title}</h3>
            <div className="flex items-center gap-4 text-xs text-text-muted mt-2">
              <span>좋아요 {post.likes}</span>
              <span>조회 {post.views}</span>
              <span>댓글 {post.comments}</span>
            </div>
          </Link>
        ))}
      </div> : <p className="text-sm text-text-muted">{emptyMessage}</p>}
    </section>
  );
}

export default function PublicProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;
  const [data, setData] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [portfolioIndex, setPortfolioIndex] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setCurrentUserId(null);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((user) => setCurrentUserId(user?.id ?? null))
      .catch(() => setCurrentUserId(null));
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
    setPortfolioIndex(0);
    setReviewPage(1);

    fetch(`${API_BASE_URL}/api/profiles/${userId}`)
      .then((response) => {
        if (response.status === 404) {
          setNotFound(true);
          return null;
        }
        if (!response.ok) {
          throw new Error('Failed to load profile');
        }
        return response.json();
      })
      .then((profile: PublicProfile | null) => {
        if (!profile) {
          setData(null);
          return;
        }

        let localPortfolios: Portfolio[] = [];
        try {
          if (currentUserId === userId) {
            localPortfolios = JSON.parse(localStorage.getItem(`editorPortfolios:${userId}`) ?? '[]')
              .filter((portfolio: { isPublic: boolean }) => portfolio.isPublic)
              .map((portfolio: { id: string; title: string; dataUrl: string; type: 'video' | 'image'; order: number }) => ({
                id: portfolio.id,
                title: portfolio.title,
                thumbnailUrl: portfolio.dataUrl,
                type: portfolio.type,
                order: portfolio.order,
              }));
          }
        } catch {
          localPortfolios = [];
        }

        setData({
          ...profile,
          portfolios: profile.portfolios.length > 0 ? profile.portfolios : localPortfolios,
          posts: profile.posts ?? [],
          likedPosts: profile.likedPosts ?? [],
        });
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [currentUserId, userId]);

  const sortedPortfolios = useMemo(() => {
    return data?.portfolios.slice().sort((a, b) => a.order - b.order) ?? [];
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-text-secondary font-bold">프로필을 불러오는 중입니다...</p>
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <p className="text-text-secondary font-bold">존재하지 않는 사용자입니다</p>
      </div>
    );
  }

  const activePortfolio = sortedPortfolios[portfolioIndex];
  const isEditor = data.role === 'EDITOR';
  const reviewCount = data.reviews.length;
  const averageRating = reviewCount > 0
    ? data.reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount
    : 0;
  const totalReviewPages = Math.max(Math.ceil(reviewCount / reviewsPerPage), 1);
  const pagedReviews = data.reviews.slice((reviewPage - 1) * reviewsPerPage, reviewPage * reviewsPerPage);

  const movePortfolio = (direction: number) => {
    if (sortedPortfolios.length === 0) {
      return;
    }
    setPortfolioIndex((current) => (current + direction + sortedPortfolios.length) % sortedPortfolios.length);
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {data.profileImage ? (
                <img src={data.profileImage} alt={data.nickname} className="w-24 h-24 rounded-full object-cover bg-surface-elevated border border-border" />
              ) : (
                <div className="w-24 h-24 rounded-full bg-surface-elevated border border-border flex items-center justify-center">
                  <User size={36} className="text-text-muted" />
                </div>
              )}
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-3xl font-bold text-text-primary">{data.nickname}</h1>
                  <RoleBadge role={data.role} />
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.fieldTags.map((tagName) => (
                    <span key={`field-${tagName}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">
                      <Tag size={12} />{tagName}
                    </span>
                  ))}
                  {data.toolTags.map((tagName) => (
                    <span key={`tool-${tagName}`} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface-elevated text-text-secondary text-xs font-bold">
                      <Wrench size={12} />{tagName}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {isEditor && <TrustTemperature temp={data.battlePower} />}
              <Link href={`/chat/${data.id}`} className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-colors">
                <MessageCircle size={16} />
                채팅 문의
              </Link>
            </div>
          </div>
        </section>

        {!isEditor && (
          <section className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-2">크리에이터 계정</h2>
            <p className="text-sm text-text-secondary">구인과 의뢰 중심 계정입니다. 에디터 전용 전투력과 포트폴리오는 표시하지 않습니다.</p>
          </section>
        )}

        {isEditor && <section className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="bg-surface border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-text-primary">포트폴리오</h2>
              {sortedPortfolios.length > 0 && (
                <span className="text-sm text-text-muted">{portfolioIndex + 1} / {sortedPortfolios.length}</span>
              )}
            </div>
            {activePortfolio ? (
              <div>
                <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-elevated border border-border">
                  {activePortfolio.thumbnailUrl && activePortfolio.type === 'video' ? (
                    <video src={activePortfolio.thumbnailUrl} className="w-full h-full object-cover" controls />
                  ) : activePortfolio.thumbnailUrl ? (
                    <img src={activePortfolio.thumbnailUrl} alt={activePortfolio.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-text-muted">이미지가 없습니다</div>
                  )}
                  <button type="button" onClick={() => movePortfolio(-1)} className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronLeft size={22} />
                  </button>
                  <button type="button" onClick={() => movePortfolio(1)} className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors">
                    <ChevronRight size={22} />
                  </button>
                </div>
                <h3 className="font-bold text-text-primary mt-4">{activePortfolio.order}. {activePortfolio.title}</h3>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center rounded-xl bg-surface-elevated border border-border text-text-muted">
                등록된 포트폴리오가 없습니다
              </div>
            )}
          </div>

          <div className="bg-surface border border-border rounded-xl p-6">
            <h2 className="text-xl font-bold text-text-primary mb-5">최근 거래내역</h2>
            <div className="space-y-3">
              {data.recentDeals.slice(0, 3).map((deal) => (
                <div key={deal.id} className="rounded-xl bg-surface-elevated border border-border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-bold text-text-primary text-sm">{deal.title}</span>
                    <span className="text-xs text-primary font-bold flex-shrink-0">{projectStatusLabel[deal.status] ?? deal.status}</span>
                  </div>
                  <p className="text-xs text-text-muted mt-2">{deal.date}</p>
                </div>
              ))}
              {data.recentDeals.length === 0 && (
                <p className="text-sm text-text-muted">최근 거래내역이 없습니다</p>
              )}
            </div>
          </div>
        </section>}

        {isEditor && <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="text-xl font-bold text-text-primary">리뷰</h2>
            <div className="flex items-center gap-2 text-sm">
              <Star size={16} className="text-rank-gold fill-rank-gold" />
              <span className="font-bold text-text-primary">{averageRating.toFixed(1)}</span>
              <span className="text-text-muted">/ 5.0 · {reviewCount}개</span>
            </div>
          </div>
          <div className="space-y-3">
            {pagedReviews.map((review) => (
              <div key={review.id} className="rounded-xl bg-surface-elevated border border-border p-4">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="font-bold text-text-primary">{review.author}</span>
                  <div className="flex items-center gap-1 text-sm">
                    <Star size={14} className="text-rank-gold fill-rank-gold" />
                    <span className="font-bold">{review.rating.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-text-secondary">{review.content}</p>
                <p className="text-xs text-text-muted mt-2">{review.date}</p>
              </div>
            ))}
            {reviewCount === 0 && (
              <p className="text-sm text-text-muted">등록된 리뷰가 없습니다</p>
            )}
          </div>
          {reviewCount > reviewsPerPage && (
            <div className="flex items-center justify-center gap-2 mt-6">
              {Array.from({ length: totalReviewPages }, (_, index) => index + 1).map((page) => (
                <button key={page} type="button" onClick={() => setReviewPage(page)} className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${reviewPage === page ? 'bg-primary text-white' : 'bg-surface-elevated text-text-secondary hover:text-text-primary'}`}>
                  {page}
                </button>
              ))}
            </div>
          )}
        </section>}

        {data.publicJobPostsVisible && (
          <ProfilePostSection title={isEditor ? '구직글' : '구인글'} posts={(data.posts ?? []).filter((post) => post.boardType === 'JOB')} emptyMessage="공개된 구인구직 글이 없습니다" />
        )}

        {data.publicCommunityPostsVisible && (
          <ProfilePostSection title="커뮤니티글" posts={(data.posts ?? []).filter((post) => post.boardType === 'COMMUNITY')} emptyMessage="공개된 커뮤니티 글이 없습니다" />
        )}

        {data.publicLikedPostsVisible && (
          <ProfilePostSection title="좋아요한 글" posts={data.likedPosts ?? []} emptyMessage="좋아요한 게시글이 없습니다" />
        )}
      </div>
    </div>
  );
}
