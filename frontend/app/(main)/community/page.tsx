'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, ChevronRight, Activity } from 'lucide-react';
import Link from 'next/link';
import { PostCard } from '@/components/post/PostCard';
import { WritePostModal } from '@/components/post/WritePostModal';
import { RankBadge } from '@/components/common/RankBadge';
import type { PostType } from '@/types/post';
import type { RankTier } from '@/types/user';

const categories = [
  { id: 'all', label: '📢 전체', dot: 'bg-text-primary' },
  { id: 'info', label: '📋 정보공유', dot: 'bg-cyan-400' },
  { id: 'free', label: '💬 자유게시판', dot: 'bg-text-secondary' },
];

const mockPosts = [
  { id: '1', type: 'info' as PostType, author: { name: '편집장인', rank: 'platinum' as RankTier, avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80' }, title: '프리미어프로 단축키 세팅 공유합니다 (효율 200%)', categoryTags: ['꿀팁'], toolTags: ['Premiere Pro'], likes: 234, comments: 42, views: 1500, timeAgo: '2시간 전' },
  { id: '2', type: 'free' as PostType, author: { name: '밤샘작업자', rank: 'gold' as RankTier, avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&q=80' }, title: '파이널컷 업데이트 이후 렌더링 오류 저만 있나요?', categoryTags: ['오류해결'], toolTags: ['Final Cut'], likes: 8, comments: 12, views: 156, timeAgo: '3시간 전' },
  { id: '3', type: 'info' as PostType, author: { name: '쇼츠공장장', rank: 'gold' as RankTier, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80' }, title: '클라이언트가 자꾸 무료 수정을 요구할 때 대처법', categoryTags: ['협업팁', '계약'], toolTags: [], likes: 156, comments: 31, views: 890, timeAgo: '하루 전' },
];

export default function CommunityPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [sort, setSort] = useState<'latest' | 'popular'>('latest');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const filteredPosts = mockPosts.filter((post) => activeCategory === 'all' || post.type === activeCategory);

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-text-primary mb-1">커뮤니티</h1>
            <p className="text-text-secondary text-sm">에디터와 유튜버가 함께하는 정보 공유 공간</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex bg-surface-elevated p-1 rounded-lg border border-border">
              {[{ id: 'latest', label: '최신순' }, { id: 'popular', label: '인기순' }].map((opt) => (
                <button key={opt.id} onClick={() => setSort(opt.id as any)} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${sort === opt.id ? 'bg-surface text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                  {opt.label}
                </button>
              ))}
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)]">
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
        <div className="flex gap-4 overflow-x-auto pb-6 mt-6 mb-2 snap-x">
          <div className="min-w-[260px] bg-gradient-to-br from-surface-elevated to-surface border border-border rounded-xl p-4 snap-start relative overflow-hidden group cursor-pointer">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-colors" />
            <div className="flex items-center gap-2 text-primary mb-2"><TrendingUp size={16} /><span className="text-xs font-bold">이달의 평균 단가</span></div>
            <div className="text-lg font-bold text-text-primary font-mono mb-1">₩14,200<span className="text-sm font-sans text-text-muted">/분</span></div>
            <div className="text-xs text-text-secondary">롱폼 편집 기준 (최근 30일)</div>
          </div>
          <div className="min-w-[260px] bg-surface border border-border rounded-xl p-4 snap-start cursor-pointer hover:border-border/80 transition-colors">
            <div className="flex items-center gap-2 text-accent mb-3"><Activity size={16} /><span className="text-xs font-bold">이번 주 핫 에디터</span></div>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80" alt="Avatar" className="w-10 h-10 rounded-full object-cover" />
              <div><div className="text-sm font-bold text-text-primary">모션그래픽왕</div><RankBadge tier="diamond" size="sm" showLabel={false} /></div>
            </div>
          </div>
          <div className="min-w-[260px] bg-surface border border-border rounded-xl p-4 snap-start flex flex-col justify-center cursor-pointer hover:bg-surface-elevated transition-colors group">
            <div className="text-sm font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">단가 투명성 가이드 새로 나왔어요</div>
            <div className="flex items-center gap-1 text-xs text-text-secondary">자세히 보기 <ChevronRight size={14} /></div>
          </div>
        </div>
        <div className="flex flex-col lg:flex-row gap-8">
          <main className="flex-1 min-w-0 space-y-4">
            {filteredPosts.length > 0 ? filteredPosts.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.05 }}>
                <PostCard id={post.id} linkTo={`/community/${post.id}`} type={post.type} title={post.title} author={post.author} categoryTags={post.categoryTags} toolTags={post.toolTags} likes={post.likes} comments={post.comments} views={post.views} timeAgo={post.timeAgo} />
              </motion.div>
            )) : <div className="text-center py-20 text-text-muted">조건에 맞는 게시글이 없습니다.</div>}
          </main>
          <aside className="w-full lg:w-80 flex-shrink-0 space-y-6">
            <div className="bg-surface border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-text-primary flex items-center gap-2">실시간 시세 📊 <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span><span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span></span></h3>
              </div>
              <div className="space-y-4">
                {[{ label: '롱폼 평균', price: 14200, unit: '분' }, { label: '숏폼 평균', price: 8500, unit: '분' }, { label: '썸네일 평균', price: 35000, unit: '건' }].map((rate, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-text-secondary">{rate.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-text-primary">₩{new Intl.NumberFormat('ko-KR').format(rate.price)}<span className="font-sans text-xs text-text-muted font-normal">/{rate.unit}</span></span>
                      <TrendingUp size={14} className="text-accent" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-border/50 text-center"><span className="text-xs text-text-muted">최근 30일 거래 기준</span></div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-base font-bold text-text-primary mb-4">지금 뜨는 글 🔥</h3>
              <div className="space-y-3">
                {['요즘 숏폼 분당 단가 1만원이면 적당한가요?', '최근 작업한 IT 리뷰 채널 인트로/아웃트로 모음', '파이널컷 업데이트 이후 렌더링 오류 저만 있나요?', '클라이언트가 자꾸 무료 수정을 요구할 때 대처법', '프리미어프로 단축키 세팅 공유합니다 (효율 200%)'].map((title, i) => (
                  <Link key={i} href="#" className="flex items-start gap-3 group">
                    <span className={`text-sm font-bold mt-0.5 ${i < 3 ? 'text-primary' : 'text-text-muted'}`}>{i + 1}</span>
                    <p className="flex-1 min-w-0 text-sm text-text-secondary group-hover:text-text-primary truncate transition-colors">{title}</p>
                  </Link>
                ))}
              </div>
            </div>
            <div className="bg-surface border border-border rounded-xl p-5">
              <h3 className="text-base font-bold text-text-primary mb-4">이번 주 활동 에디터</h3>
              <div className="space-y-4">
                {[{ name: '모션그래픽왕', rank: 'diamond' as RankTier, specialty: 'IT/테크 전문 모션그래픽', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80' }, { name: '예능자막마스터', rank: 'platinum' as RankTier, specialty: '워크맨 스타일 예능 자막', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80' }, { name: '빠른컷편집러', rank: 'gold' as RankTier, specialty: '당일 마감 가능한 컷편집', avatar: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=100&q=80' }].map((editor, i) => (
                  <Link key={i} href={`/profile/${editor.name}`} className="flex items-center gap-3 group">
                    <img src={editor.avatar} alt={editor.name} className="w-10 h-10 rounded-full object-cover bg-surface-elevated" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-sm font-bold text-text-primary group-hover:text-primary transition-colors">{editor.name}</span>
                        <RankBadge tier={editor.rank} size="sm" showLabel={false} />
                      </div>
                      <p className="text-xs text-text-secondary truncate">{editor.specialty}</p>
                    </div>
                  </Link>
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
