'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, TrendingUp, Users, Briefcase, Sparkles, MessageSquare, ArrowRight, ChevronDown } from 'lucide-react';
import { EditorCard } from '@/components/profile/EditorCard';
import { useAuth } from '@/hooks/useAuth';
import { useModal } from '@/store/modalStore';

type SearchCategory = 'jobs' | 'community';

const categoryOptions: { value: SearchCategory; label: string }[] = [
  { value: 'jobs', label: '구인구직' },
  { value: 'community', label: '커뮤니티' },
];

const popularTags = ['롱폼', '숏폼', '게임', '프리미어프로', '파이널컷', '썸네일'];

const mockFeaturedEditors = [
  { id: '1', nickname: '모션그래픽왕', rank: 'diamond' as const, rating: 4.9, reviewCount: 128, thumbnailUrl: 'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=800&q=80', minPrice: 20000, maxPrice: 35000, tags: ['애프터이펙트', '인포그래픽', '인트로'], responseTime: '1시간 이내' },
  { id: '2', nickname: '예능자막마스터', rank: 'platinum' as const, rating: 4.8, reviewCount: 85, thumbnailUrl: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80', minPrice: 12000, maxPrice: 18000, tags: ['프리미어프로', '예능자막', '먹방'], responseTime: '30분 이내' },
  { id: '3', nickname: '빠른컷편집러', rank: 'gold' as const, rating: 4.7, reviewCount: 42, thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80', minPrice: 8000, maxPrice: 12000, tags: ['파이널컷', '브이로그', '쇼츠'], responseTime: '10분 이내' },
];

const quickAccessCards = [
  { icon: Briefcase, title: '구인구직 바로가기', desc: '검증된 유튜버와 에디터들이 모이는 곳', path: '/jobs', color: 'text-primary' },
  { icon: Sparkles, title: '맞춤매칭 시작', desc: '조건에 맞는 에디터 5명을 추천받으세요', path: '/matching', color: 'text-accent' },
  { icon: MessageSquare, title: '커뮤니티 둘러보기', desc: '단가, 팁, 포트폴리오 정보가 한 곳에', path: '/community', color: 'text-violet-400' },
];

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { openModal } = useModal();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('jobs');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleQuickCardClick = (e: React.MouseEvent, path: string) => {
    if (path === '/matching' && user?.role === 'EDITOR') {
      e.preventDefault();
      openModal({
        title: '유튜버 전용 서비스',
        message: '맞춤매칭은 유튜버 계정에서만 이용할 수 있습니다.\n에디터로 로그인된 상태에서는 접근할 수 없어요.',
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const canSearch = query.trim().length > 1;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSearch) return;
    router.push(`/${category}?q=${encodeURIComponent(query.trim())}`);
  };

  const handleTagClick = (tag: string) => {
    setQuery(tag);
    router.push(`/${category}?q=${encodeURIComponent(tag)}`);
  };

  const selectedLabel = categoryOptions.find((o) => o.value === category)?.label ?? '구인구직';

  return (
    <div className="min-h-screen">
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent -z-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
              유튜브 편집자 매칭의 <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">새로운 기준</span>
            </h1>
            <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
              투명한 분당 단가, 검증된 포트폴리오. 스트레스 없는 영상 제작 파트너를 만나보세요.
            </p>

            {/* 검색바 */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="max-w-2xl mx-auto mb-6">
              <form onSubmit={handleSearch}>
                <div className="relative group">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all opacity-50" />
                  <div className="relative flex items-center bg-surface border-2 border-border group-focus-within:border-primary rounded-2xl transition-colors shadow-2xl min-w-0">

                    {/* 카테고리 드롭다운 */}
                    <div className="relative shrink-0" ref={dropdownRef}>
                      <button
                        type="button"
                        onClick={() => setDropdownOpen(!dropdownOpen)}
                        className="flex items-center gap-1 pl-3 pr-2 sm:pl-4 sm:pr-3 py-4 sm:py-5 text-xs sm:text-sm text-text-secondary border-r border-border hover:text-text-primary transition-colors whitespace-nowrap"
                      >
                        {selectedLabel}
                        <ChevronDown size={13} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                      {dropdownOpen && (
                        <div className="absolute top-full left-0 mt-1 w-28 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
                          {categoryOptions.map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => { setCategory(option.value); setDropdownOpen(false); }}
                              className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                category === option.value ? 'text-primary bg-primary/10' : 'text-text-secondary hover:bg-surface-elevated'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Search size={18} className="text-text-muted ml-2 sm:ml-4 shrink-0" />
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="편집자, 스타일, 툴로 검색"
                      className="flex-1 min-w-0 bg-transparent px-2 sm:px-3 py-4 sm:py-5 text-sm sm:text-base text-text-primary placeholder:text-text-muted focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={!canSearch}
                      className="m-1.5 sm:m-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-primary text-white font-bold text-xs sm:text-sm transition-colors shadow-lg shadow-primary/20 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 disabled:hover:bg-primary shrink-0"
                    >
                      검색
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>

            {/* 인기 검색어 */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="flex flex-wrap gap-2 justify-center items-center">
              <span className="text-sm text-text-muted mr-2">인기 검색어:</span>
              {popularTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleTagClick(tag)}
                  className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-secondary hover:border-primary/50 hover:text-text-primary transition-all"
                >
                  {tag}
                </button>
              ))}
            </motion.div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, label: '누적 거래액', value: '₩12.4억+' },
              { icon: Users, label: '활동 에디터', value: '3,240명' },
              { icon: ShieldCheck, label: '평균 만족도', value: '4.8/5.0' },
              { icon: Zap, label: '평균 매칭시간', value: '14분' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center">
                <stat.icon size={20} className="text-primary mb-2 sm:mb-3" />
                <div className="text-xl sm:text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
                <div className="text-xs sm:text-sm text-text-secondary text-center">{stat.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="py-20 border-y border-border bg-surface/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-text-primary mb-2">빠른 시작</h2>
            <p className="text-text-secondary">원하는 방식으로 시작해보세요</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quickAccessCards.map((card, i) => (
              <motion.div key={card.path} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}>
                <Link href={card.path} onClick={(e) => handleQuickCardClick(e, card.path)} className="group block bg-surface border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
                  <div className={`inline-flex p-3 rounded-xl bg-surface-elevated ${card.color} mb-5`}>
                    <card.icon size={28} />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary mb-2 group-hover:text-primary transition-colors">{card.title}</h3>
                  <p className="text-sm text-text-secondary mb-4 leading-relaxed">{card.desc}</p>
                  <div className="flex items-center gap-1 text-sm font-medium text-text-secondary group-hover:text-primary group-hover:gap-2 transition-all">
                    바로가기 <ArrowRight size={14} />
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-text-primary mb-2">이달의 탑 에디터</h2>
              <p className="text-text-secondary">가장 높은 매너온도와 만족도를 기록한 전문가들입니다.</p>
            </div>
            <Link href="/jobs" className="text-primary font-medium hover:underline hidden sm:block">전체보기 &rarr;</Link>
          </div>
          {mockFeaturedEditors.length === 0 ? (
            <div className="text-center py-20 text-text-muted">이달의 탑 에디터를 선정 중입니다.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {mockFeaturedEditors.map((editor) => <EditorCard key={editor.id} {...editor} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
