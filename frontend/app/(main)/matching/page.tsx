'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { MatchingCard } from '@/components/matching/MatchingCard';

export default function MatchingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [priceRange, setPriceRange] = useState(15000);

  const handleMatch = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
    setTimeout(() => setStep(3), 2000);
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="form" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-surface border border-border rounded-2xl p-8 md:p-12 shadow-xl">
              <div className="text-center mb-10">
                <h1 className="text-3xl font-bold text-text-primary mb-3">딱 맞는 에디터를 찾아드릴게요</h1>
                <p className="text-text-secondary">원하는 조건을 선택하면 5명의 최적의 에디터를 매칭해 드립니다.</p>
              </div>
              <form onSubmit={handleMatch} className="space-y-8">
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">콘텐츠 카테고리</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['게임', '뷰티', '브이로그', 'IT/테크', '예능', '정보전달', '음악', '기타'].map((cat) => (
                      <label key={cat} className="cursor-pointer">
                        <input type="radio" name="category" className="peer sr-only" defaultChecked={cat === '게임'} />
                        <div className="px-4 py-3 rounded-xl border border-border bg-surface-elevated text-center text-sm text-text-secondary peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all hover:border-primary/50">{cat}</div>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">선호하는 편집 툴</label>
                  <div className="flex flex-wrap gap-3">
                    {['상관없음', 'Premiere Pro', 'Final Cut', 'After Effects', 'DaVinci Resolve'].map((tool) => (
                      <label key={tool} className="cursor-pointer flex-1 min-w-[120px]">
                        <input type="radio" name="tool" className="peer sr-only" defaultChecked={tool === '상관없음'} />
                        <div className="px-4 py-3 rounded-xl border border-border bg-surface-elevated text-center text-sm text-text-secondary peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">{tool}</div>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">영상 길이</label>
                    <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
                      {['숏폼', '미드폼', '롱폼'].map((len) => (
                        <label key={len} className="flex-1 cursor-pointer">
                          <input type="radio" name="length" className="peer sr-only" defaultChecked={len === '롱폼'} />
                          <div className="py-2 text-center text-sm rounded-lg text-text-secondary peer-checked:bg-surface peer-checked:text-text-primary peer-checked:shadow-sm transition-all">{len}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">납기 속도</label>
                    <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
                      {['여유롭게', '보통 (3~4일)', '빠르게 (1~2일)'].map((speed) => (
                        <label key={speed} className="flex-1 cursor-pointer">
                          <input type="radio" name="speed" className="peer sr-only" defaultChecked={speed === '보통 (3~4일)'} />
                          <div className="py-2 text-center text-sm rounded-lg text-text-secondary peer-checked:bg-surface peer-checked:text-text-primary peer-checked:shadow-sm transition-all">{speed}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                    <label className="block text-sm font-bold text-text-primary mb-3">작업 경력</label>
                    <div className="grid grid-cols-2 gap-3">
                      {['신입 (가성비)', '1~3년 (안정적)', '3~5년 (숙련자)', '5년 이상 (전문가)'].map((exp) => (
                        <label key={exp} className="cursor-pointer">
                          <input type="radio" name="exp" className="peer sr-only" defaultChecked={exp === '1~3년 (안정적)'} />
                          <div className="px-4 py-2.5 rounded-xl border border-border bg-surface-elevated text-center text-sm text-text-secondary peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary transition-all">{exp}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between items-end mb-3">
                      <label className="block text-sm font-bold text-text-primary">희망 단가 (분당)</label>
                      <span className="font-mono text-primary font-bold">₩{new Intl.NumberFormat('ko-KR').format(priceRange)}</span>
                    </div>
                    <div className="pt-2">
                      <input type="range" min="3000" max="30000" step="1000" value={priceRange} onChange={(e) => setPriceRange(Number(e.target.value))} className="w-full accent-primary h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer" />
                      <div className="flex justify-between text-xs text-text-muted mt-2 font-mono"><span>₩3,000</span><span>₩30,000+</span></div>
                    </div>
                  </div>
                </div>
                <button type="submit" className="w-full py-4 bg-primary text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]">
                  <Search size={20} />매칭 시작하기
                </button>
              </form>
            </motion.div>
          )}
          {step === 2 && (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center py-32">
              <Loader2 size={48} className="text-primary animate-spin mb-6" />
              <h2 className="text-2xl font-bold text-text-primary mb-2">최적의 에디터를 찾고 있습니다...</h2>
              <p className="text-text-secondary">포트폴리오와 작업 스타일을 분석중입니다.</p>
            </motion.div>
          )}
          {step === 3 && (
            <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-7xl mx-auto">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-text-primary mb-2">5명의 에디터를 찾았어요!</h2>
                  <p className="text-text-secondary">조건에 가장 잘 맞는 상위 5명의 블라인드 프로필입니다.</p>
                </div>
                <button onClick={() => setStep(1)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary hover:bg-surface transition-colors">
                  <RefreshCw size={16} />다시 찾기
                </button>
              </div>
              <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x">
                {[
                  { id: '1', price: 15000, len: '롱폼', cats: ['게임', '예능'], tools: ['Premiere Pro', 'After Effects'] },
                  { id: '2', price: 12000, len: '롱폼', cats: ['게임', '브이로그'], tools: ['Final Cut'] },
                  { id: '3', price: 14000, len: '롱폼', cats: ['게임', 'IT/테크'], tools: ['Premiere Pro'] },
                  { id: '4', price: 10000, len: '롱폼', cats: ['게임'], tools: ['Premiere Pro'] },
                  { id: '5', price: 8000, len: '롱폼', cats: ['게임', '기타'], tools: ['DaVinci Resolve'] },
                ].map((editor, i) => (
                  <div key={editor.id} className="min-w-[280px] sm:min-w-[320px] flex-1 snap-center">
                    <MatchingCard
                      id={editor.id}
                      thumbnails={[
                        `https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=400&q=80&sig=${i + 10}`,
                        `https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=400&q=80&sig=${i + 20}`,
                      ]}
                      categories={editor.cats}
                      tools={editor.tools}
                      videoLength={editor.len}
                      minPrice={editor.price}
                      maxPrice={editor.price + 3000}
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
