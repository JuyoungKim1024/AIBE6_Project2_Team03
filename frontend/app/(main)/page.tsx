'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Search, ShieldCheck, Zap, TrendingUp, Users, Briefcase, Sparkles, MessageSquare, ArrowRight } from 'lucide-react';
import { PriceTicker } from '@/components/home/PriceTicker';
import { EditorCard } from '@/components/profile/EditorCard';

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
  const [query, setQuery] = useState('');
  return (
    <div className="min-h-screen">
      <PriceTicker />
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent -z-10" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary mb-6 leading-tight">
              유튜브 편집자 매칭의 <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">새로운 기준</span>
            </h1>
            <p className="text-lg text-text-secondary max-w-2xl mx-auto mb-12 leading-relaxed">
              투명한 분당 단가, 검증된 포트폴리오. 스트레스 없는 영상 제작 파트너를 만나보세요.
            </p>
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="max-w-2xl mx-auto mb-6">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-2xl blur-xl group-focus-within:blur-2xl transition-all opacity-50" />
                <div className="relative flex items-center bg-surface border-2 border-border group-focus-within:border-primary rounded-2xl transition-colors shadow-2xl">
                  <Search size={22} className="text-text-muted ml-5" />
                  <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="편집자, 작업 스타일, 툴로 검색해보세요" className="flex-1 bg-transparent px-4 py-5 text-base text-text-primary placeholder:text-text-muted focus:outline-none" />
                  <button className="m-2 px-6 py-3 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">검색</button>
                </div>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.3 }} className="flex flex-wrap gap-2 justify-center items-center">
              <span className="text-sm text-text-muted mr-2">인기 검색어:</span>
              {popularTags.map((tag) => (
                <button key={tag} onClick={() => setQuery(tag)} className="px-3 py-1.5 rounded-full bg-surface border border-border text-sm text-text-secondary hover:border-primary/50 hover:text-text-primary transition-all">{tag}</button>
              ))}
            </motion.div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: TrendingUp, label: '누적 거래액', value: '₩12.4억+' },
              { icon: Users, label: '활동 에디터', value: '3,240명' },
              { icon: ShieldCheck, label: '평균 만족도', value: '4.8/5.0' },
              { icon: Zap, label: '평균 매칭시간', value: '14분' },
            ].map((stat, i) => (
              <div key={i} className="bg-surface/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 flex flex-col items-center justify-center">
                <stat.icon size={24} className="text-primary mb-3" />
                <div className="text-2xl font-bold text-text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-text-secondary">{stat.label}</div>
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
                <Link href={card.path} className="group block bg-surface border border-border rounded-2xl p-8 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] transition-all">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockFeaturedEditors.map((editor) => <EditorCard key={editor.id} {...editor} />)}
          </div>
        </div>
      </section>
    </div>
  );
}
