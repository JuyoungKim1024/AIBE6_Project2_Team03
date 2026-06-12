'use client';

import React, { Suspense, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { PostCard } from '@/components/post/PostCard';
import { WritePostModal } from '@/components/post/WritePostModal';
import type { PostType } from '@/types/post';
import type { RankTier } from '@/types/user';

type JobType = 'hiring' | 'looking';

interface JobPost {
  id: string;
  type: JobType;
  title: string;
  author: { name: string; rank: RankTier; avatar: string; region: string };
  categoryTags: string[];
  toolTags: string[];
  minPrice?: number;
  maxPrice?: number;
  priceHidden?: boolean;
  views: number;
  comments: number;
  likes: number;
  timeAgo: string;
  thumbnail?: string;
}

const filterChips = ['롱폼', '숏폼', '게임', '음악', '브이로그'];

const mockJobs: JobPost[] = [
  { id: '1', type: 'hiring', title: '게임 하이라이트 주 2회 편집해주실 분 구합니다', author: { name: '겜돌이TV', rank: 'silver', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&q=80', region: '온라인' }, categoryTags: ['롱폼', '게임'], toolTags: ['Premiere Pro'], minPrice: 15000, maxPrice: 25000, views: 342, comments: 4, likes: 12, timeAgo: '10분 전' },
  { id: '2', type: 'looking', title: '예능 자막/효과음 빵빵하게 넣어드립니다. 빠른 작업 가능!', author: { name: '예능자막마스터', rank: 'platinum', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80', region: '서울' }, categoryTags: ['롱폼', '예능'], toolTags: ['Premiere Pro'], minPrice: 12000, views: 521, comments: 8, likes: 34, timeAgo: '1시간 전', thumbnail: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&q=80' },
  { id: '3', type: 'hiring', title: 'IT 리뷰 채널 전속 편집자 구인 (월급제 가능)', author: { name: '테크리뷰어', rank: 'diamond', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80', region: '판교' }, categoryTags: ['롱폼', 'IT/테크'], toolTags: ['Premiere Pro'], minPrice: 20000, maxPrice: 30000, views: 1280, comments: 24, likes: 89, timeAgo: '5시간 전' },
  { id: '4', type: 'looking', title: '쇼츠/릴스 전문 편집자입니다. 트렌디한 밈 활용 잘합니다.', author: { name: '쇼츠공장장', rank: 'gold', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80', region: '온라인' }, categoryTags: ['숏폼'], toolTags: ['After Effects'], minPrice: 8000, views: 432, comments: 5, likes: 22, timeAgo: '7시간 전' },
  { id: '5', type: 'hiring', title: '음악 채널 뮤직비디오 컷편집 + 비주얼 작업하실 분', author: { name: '음원사장', rank: 'gold', avatar: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&q=80', region: '서울' }, categoryTags: ['롱폼', '음악'], toolTags: ['After Effects'], minPrice: 18000, views: 234, comments: 6, likes: 15, timeAgo: '12시간 전' },
  { id: '6', type: 'hiring', title: '브이로그 감성 컷편집 + 색보정 에디터님 모십니다', author: { name: '일상기록', rank: 'bronze', avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80', region: '온라인' }, categoryTags: ['롱폼', '브이로그'], toolTags: ['Final Cut'], priceHidden: true, views: 89, comments: 0, likes: 3, timeAgo: '하루 전' },
  { id: '7', type: 'looking', title: '열심히 배우면서 일할 신입 편집자입니다!', author: { name: '신입에디터', rank: 'bronze', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80', region: '서울' }, categoryTags: [], toolTags: ['Premiere Pro'], priceHidden: true, views: 156, comments: 2, likes: 5, timeAgo: '하루 전' },
];

function JobsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') ?? '';

  const [activeTab, setActiveTab] = useState<JobType>('hiring');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sort, setSort] = useState('latest');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) => prev.includes(filter) ? prev.filter((f) => f !== filter) : [...prev, filter]);
  };

  const filteredJobs = mockJobs.filter((j) => {
    const matchesTab = j.type === activeTab;
    const matchesFilter = activeFilters.length === 0 || j.categoryTags.some((t) => activeFilters.includes(t));
    const matchesQuery = query === '' || (
      j.title.includes(query) ||
      j.categoryTags.some((t) => t.includes(query)) ||
      j.toolTags.some((t) => t.includes(query)) ||
      j.author.name.includes(query)
    );
    return matchesTab && matchesFilter && matchesQuery;
  });

  return (
    <div className="min-h-screen">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-text-primary mb-1">구인구직</h1>
          {query ? (
            <p className="text-text-secondary text-sm">
              <span className="text-primary font-medium">"{query}"</span> 검색 결과 {filteredJobs.length}건
            </p>
          ) : (
            <p className="text-text-secondary text-sm">검증된 유튜버와 에디터가 만나는 곳</p>
          )}
        </div>
        <div className="flex border-b border-border mb-6">
          {[{ id: 'hiring' as const, label: '구인 (Hiring)', color: 'text-accent' }, { id: 'looking' as const, label: '구직 (Looking for Work)', color: 'text-primary' }].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`relative px-6 py-4 text-sm font-bold transition-colors ${isActive ? 'text-text-primary' : 'text-text-secondary hover:text-text-primary'}`}>
                {tab.label}
                {isActive && (
                  <motion.div layoutId="jobTabIndicator" className={`absolute bottom-0 left-0 right-0 h-0.5 ${tab.id === 'hiring' ? 'bg-accent' : 'bg-primary'}`} />
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex gap-2 overflow-x-auto pb-1 flex-1">
            {filterChips.map((chip) => {
              const isActive = activeFilters.includes(chip);
              return (
                <button key={chip} onClick={() => toggleFilter(chip)} className={`px-3 py-1.5 rounded-full text-xs font-medium border whitespace-nowrap transition-all ${isActive ? 'bg-primary/10 border-primary/50 text-primary' : 'bg-surface border-border text-text-secondary hover:border-text-muted'}`}>
                  {chip}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="appearance-none bg-surface border border-border rounded-lg pl-3 pr-9 py-2 text-sm text-text-primary focus:outline-none focus:border-primary cursor-pointer">
                <option value="latest">최신순</option>
                <option value="popular">인기순</option>
                <option value="price">단가높은순</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
            </div>
            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-1.5 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-colors shadow-[0_0_15px_rgba(59,130,246,0.3)] whitespace-nowrap">
              <Plus size={16} />글쓰기
            </button>
          </div>
        </div>
        <div className="space-y-4">
          {filteredJobs.length === 0 ? (
            <p className="text-center text-text-muted py-20 text-sm">검색 결과가 없습니다.</p>
          ) : (
            filteredJobs.map((job, i) => (
              <motion.div key={job.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <PostCard id={job.id} linkTo={`/jobs/${job.id}`} type={job.type as PostType} title={job.title} author={job.author} categoryTags={job.categoryTags} toolTags={job.toolTags} minPrice={job.minPrice} maxPrice={job.maxPrice} priceHidden={job.priceHidden} likes={job.likes} comments={job.comments} views={job.views} timeAgo={job.timeAgo} thumbnail={job.thumbnail} />
              </motion.div>
            ))
          )}
        </div>
      </div>
      <WritePostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-text-muted text-sm">불러오는 중...</div>}>
      <JobsContent />
    </Suspense>
  );
}
