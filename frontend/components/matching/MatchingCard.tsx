'use client';

import React from 'react';
import Link from 'next/link';

export interface MatchingCardProps {
  id: string;
  thumbnails: string[];
  categories: string[];
  tools: string[];
  videoLengths: string[];
  minPrice: number;
  maxPrice: number;
  priceUnit?: string;
}

export function MatchingCard({ id, thumbnails, categories, tools, videoLengths, minPrice, maxPrice, priceUnit = '분' }: MatchingCardProps) {
  const validThumbs = thumbnails.slice(0, 2);
  const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <div className="group bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
      <Link href={`/matching/editor/${id}`} className="relative aspect-video overflow-hidden bg-surface-elevated">
        {validThumbs.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">포트폴리오 없음</div>
        )}
        {validThumbs.length === 1 && (
          <img src={validThumbs[0]} alt="Portfolio preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        {validThumbs.length === 2 && (
          <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-border">
            {validThumbs.map((thumb, idx) => (
              <div key={idx} className="relative w-full h-full overflow-hidden">
                <img src={thumb} alt="Portfolio preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        )}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
          블라인드 프로필
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-1.5 mb-3">
          {videoLengths.length > 0
            ? videoLengths.map((v) => (
                <span key={v} className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">{v}</span>
              ))
            : <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">전체</span>
          }
          {categories.map((cat) => (
            <span key={cat} className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-secondary border border-border/50">{cat}</span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tools.map((tool) => (
            <span key={tool} className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-muted">{tool}</span>
          ))}
        </div>
        <div className="mt-auto pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-text-secondary font-medium">예상 단가</span>
            <div className="text-sm font-bold text-text-primary">
              {minPrice > 0 && maxPrice > 0
                ? <span>₩{fmt(minPrice)} ~ ₩{fmt(maxPrice)}<span className="text-xs text-text-muted font-normal ml-0.5">원/{priceUnit}</span></span>
                : <span className="text-text-muted text-xs">단가 미설정</span>
              }
            </div>
          </div>
          <Link href={`/matching/editor/${id}`} className="block w-full py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white text-center rounded-lg text-sm font-bold transition-colors">
            상세 프로필 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
