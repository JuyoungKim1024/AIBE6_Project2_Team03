'use client';

import React from 'react';
import Link from 'next/link';
import type { PortfolioPreview } from '@/types/matching';

export interface MatchingCardProps {
  id: string;
  portfolios: PortfolioPreview[];
  categories: string[];
  tools: string[];
  videoLengths: string[];
  minPrice: number;
  maxPrice: number;
  priceUnit?: string;
  showBlindBadge?: boolean;
}

function PortfolioItem({ item, className }: { item: PortfolioPreview; className: string }) {
  if (item.type === 'video') {
    return <video src={item.url} className={className} autoPlay muted loop playsInline />;
  }
  return <img src={item.url} alt="포트폴리오" className={className} />;
}

export function MatchingCard({ id, portfolios, categories, tools, videoLengths, minPrice, maxPrice, priceUnit = '분', showBlindBadge = true }: MatchingCardProps) {
  const items = portfolios.slice(0, 2);
  const fmt = (n: number) => new Intl.NumberFormat('ko-KR').format(n);

  return (
    <div className="group bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
      <Link href={`/matching/editor/${id}`} className="relative aspect-video overflow-hidden bg-surface-elevated">
        {items.length === 0 && (
          <div className="w-full h-full flex items-center justify-center text-text-muted text-sm">포트폴리오 없음</div>
        )}
        {items.length === 1 && (
          <PortfolioItem item={items[0]} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        )}
        {items.length === 2 && (
          <div className="grid grid-cols-2 gap-0.5 w-full h-full bg-border">
            {items.map((item, idx) => (
              <div key={idx} className="relative w-full h-full overflow-hidden">
                <PortfolioItem item={item} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ))}
          </div>
        )}
        {showBlindBadge && (
          <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
            블라인드 프로필
          </div>
        )}
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
