'use client';

import React from 'react';
import Link from 'next/link';
import { PlayCircle } from 'lucide-react';

export interface MatchingCardProps {
  id: string;
  thumbnails: string[];
  categories: string[];
  tools: string[];
  videoLength: string;
  minPrice: number;
  maxPrice: number;
}

export function MatchingCard({ id, thumbnails, categories, tools, videoLength, minPrice, maxPrice }: MatchingCardProps) {
  return (
    <div className="group bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
      <Link href={`/matching/editor/${id}`} className="relative grid grid-cols-2 gap-0.5 bg-border aspect-video overflow-hidden">
        {thumbnails.slice(0, 2).map((thumb, idx) => (
          <div key={idx} className="relative w-full h-full">
            <img src={thumb} alt="Portfolio preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            {idx === 0 && (
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <PlayCircle size={32} className="text-white opacity-80" />
              </div>
            )}
          </div>
        ))}
        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs font-bold px-2 py-1 rounded-md border border-white/10">
          블라인드 프로필
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex flex-wrap gap-1.5 mb-3">
          <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-xs font-bold">{videoLength}</span>
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
            <div className="font-mono text-sm font-bold text-text-primary">
              ₩{new Intl.NumberFormat('ko-KR').format(minPrice)} ~ ₩{new Intl.NumberFormat('ko-KR').format(maxPrice)}
              <span className="font-sans text-xs text-text-muted font-normal">/분</span>
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
