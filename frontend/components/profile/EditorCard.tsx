'use client';

import React from 'react';
import Link from 'next/link';
import { Star, Clock, PlayCircle } from 'lucide-react';
import { RankBadge } from '@/components/common/RankBadge';
import type { RankTier } from '@/types/user';

export interface EditorCardProps {
  id: string;
  nickname: string;
  rank: RankTier;
  rating: number;
  reviewCount: number;
  thumbnailUrl: string;
  minPrice: number;
  maxPrice: number;
  tags: string[];
  responseTime?: string;
  actionButton?: React.ReactNode;
}

export function EditorCard({ id, nickname, rank, rating, reviewCount, thumbnailUrl, minPrice, maxPrice, tags, responseTime, actionButton }: EditorCardProps) {
  return (
    <div className="group bg-surface rounded-xl border border-border overflow-hidden hover:border-primary/50 transition-colors flex flex-col h-full">
      <Link href={`/freelancer/${id}`} className="relative aspect-video overflow-hidden block">
        <img src={thumbnailUrl} alt={`${nickname} portfolio`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
          <PlayCircle size={48} className="text-white opacity-80" />
        </div>
        <div className="absolute top-3 left-3">
          <RankBadge tier={rank} size="sm" />
        </div>
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <Link href={`/freelancer/${id}`} className="font-bold text-lg text-text-primary hover:text-primary transition-colors">
            {nickname}
          </Link>
          <div className="flex items-center gap-1 text-sm">
            <Star size={14} className="text-rank-gold fill-rank-gold" />
            <span className="font-medium text-text-primary">{rating.toFixed(1)}</span>
            <span className="text-text-muted">({reviewCount})</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded bg-surface-elevated text-xs text-text-secondary">{tag}</span>
          ))}
        </div>
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-text-secondary">예상 단가</span>
            <div className="font-mono text-sm font-medium">
              ₩{new Intl.NumberFormat('ko-KR').format(minPrice)} ~ ₩{new Intl.NumberFormat('ko-KR').format(maxPrice)}
              <span className="font-sans text-xs text-text-muted">/분</span>
            </div>
          </div>
          {responseTime && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <Clock size={12} />
              <span>평균 응답시간: {responseTime}</span>
            </div>
          )}
          {actionButton && <div className="pt-2 border-t border-border mt-2">{actionButton}</div>}
        </div>
      </div>
    </div>
  );
}
