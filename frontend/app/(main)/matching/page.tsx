'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, RefreshCw } from 'lucide-react';
import { MatchingCard } from '@/components/matching/MatchingCard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

const CATEGORIES = ['게임', '뷰티', '브이로그', 'IT/테크', '예능', '정보전달', '음악', '기타'];
const TOOLS = ['상관없음', 'Premiere Pro', 'Final Cut', 'After Effects', 'DaVinci Resolve'];
const VIDEO_LENGTHS = ['숏폼', '미드폼', '롱폼'];

type BlindEditor = {
  id: string;
  thumbnails: string[];
  categories: string[];
  tools: string[];
  matchPrice: number | null;
  matchPriceUnit: string;
};

export default function MatchingPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState('');
  const [tool, setTool] = useState('상관없음');
  const [videoLength, setVideoLength] = useState('롱폼');
  const [maxPrice, setMaxPrice] = useState(15000);
  const [editors, setEditors] = useState<BlindEditor[]>([]);
  const [error, setError] = useState('');

  const canSearch = category !== '';

  const handleMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSearch) return;

    setStep(2);
    setError('');

    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (tool && tool !== '상관없음') params.set('tool', tool);
      params.set('maxPrice', String(maxPrice));

      const res = await fetch(`${API_BASE_URL}/api/matching/editors?${params}`);
      if (!res.ok) throw new Error();
      const data: BlindEditor[] = await res.json();
      setEditors(data);
    } catch {
      setError('에디터 검색 중 오류가 발생했습니다.');
      setEditors([]);
    }

    setStep(3);
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
                  <label className="block text-sm font-bold text-text-primary mb-3">
                    콘텐츠 카테고리 <span className="text-accent">*</span>
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`px-4 py-3 rounded-xl border text-sm transition-all ${
                          category === cat
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface-elevated text-text-secondary hover:border-primary/50'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                  {!category && (
                    <p className="text-xs text-accent mt-2">카테고리를 선택해야 매칭을 시작할 수 있습니다.</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">선호하는 편집 툴</label>
                  <div className="flex flex-wrap gap-3">
                    {TOOLS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTool(t)}
                        className={`flex-1 min-w-[120px] px-4 py-3 rounded-xl border text-sm transition-all ${
                          tool === t
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border bg-surface-elevated text-text-secondary'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-text-primary mb-3">영상 길이</label>
                  <div className="flex bg-surface-elevated p-1 rounded-xl border border-border">
                    {VIDEO_LENGTHS.map((len) => (
                      <button
                        key={len}
                        type="button"
                        onClick={() => setVideoLength(len)}
                        className={`flex-1 py-2 text-center text-sm rounded-lg transition-all ${
                          videoLength === len
                            ? 'bg-surface text-text-primary shadow-sm'
                            : 'text-text-secondary'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-end mb-3">
                    <label className="block text-sm font-bold text-text-primary">희망 단가 (분당 최대)</label>
                    <span className="font-mono text-primary font-bold">₩{new Intl.NumberFormat('ko-KR').format(maxPrice)}</span>
                  </div>
                  <input
                    type="range"
                    min="3000"
                    max="30000"
                    step="1000"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-surface-elevated rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-text-muted mt-2 font-mono">
                    <span>₩3,000</span><span>₩30,000+</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!canSearch}
                  className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                    canSearch
                      ? 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.2)] hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]'
                      : 'bg-surface-elevated text-text-muted cursor-not-allowed'
                  }`}
                >
                  <Search size={20} />
                  매칭 시작하기
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
                  {editors.length > 0 ? (
                    <>
                      <h2 className="text-3xl font-bold text-text-primary mb-2">{editors.length}명의 에디터를 찾았어요!</h2>
                      <p className="text-text-secondary">조건에 가장 잘 맞는 블라인드 프로필입니다.</p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold text-text-primary mb-2">조건에 맞는 편집자가 없습니다</h2>
                      <p className="text-text-secondary">필터를 조정하거나 단가 범위를 넓혀보세요.</p>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setStep(1)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-elevated border border-border text-sm text-text-primary hover:bg-surface transition-colors"
                >
                  <RefreshCw size={16} />다시 찾기
                </button>
              </div>

              {error && (
                <p className="text-sm text-accent mb-4">{error}</p>
              )}

              {editors.length > 0 && (
                <div className="flex overflow-x-auto pb-8 -mx-4 px-4 sm:mx-0 sm:px-0 gap-6 snap-x">
                  {editors.map((editor) => (
                    <div key={editor.id} className="min-w-[280px] sm:min-w-[320px] flex-1 snap-center">
                      <MatchingCard
                        id={editor.id}
                        thumbnails={editor.thumbnails}
                        categories={editor.categories}
                        tools={editor.tools}
                        videoLength={videoLength}
                        minPrice={editor.matchPrice ?? 0}
                        maxPrice={(editor.matchPrice ?? 0) + 3000}
                        priceUnit={editor.matchPriceUnit}
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
