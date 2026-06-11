'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

const rates = [
  { label: '롱폼 편집', price: 14200, trend: 'up' },
  { label: '쇼츠/릴스', price: 8500, trend: 'up' },
  { label: '썸네일 제작', price: 12000, trend: 'down' },
  { label: '모션그래픽', price: 25000, trend: 'up' },
  { label: '게임 하이라이트', price: 13500, trend: 'up' },
];

export function PriceTicker() {
  return (
    <div className="w-full bg-surface border-b border-border overflow-hidden py-2.5 flex items-center relative z-10">
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10" />
      <div className="flex whitespace-nowrap animate-ticker">
        {[...rates, ...rates, ...rates].map((rate, i) => (
          <div key={i} className="flex items-center gap-2 px-6 border-r border-border/50 last:border-0">
            <span className="text-sm text-text-secondary">{rate.label} 평균</span>
            <span className="text-sm font-mono font-medium text-text-primary">
              ₩{new Intl.NumberFormat('ko-KR').format(rate.price)}/분
            </span>
            <TrendingUp
              size={14}
              className={rate.trend === 'up' ? 'text-accent' : 'text-primary rotate-180'}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
