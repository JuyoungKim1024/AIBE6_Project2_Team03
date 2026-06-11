'use client';

import React from 'react';
import { Shield } from 'lucide-react';
import type { RankTier } from '@/types/user';

export type { RankTier };

interface RankBadgeProps {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig = {
  bronze: { color: 'text-rank-bronze', bg: 'bg-rank-bronze/10', border: 'border-rank-bronze/30', label: '브론즈' },
  silver: { color: 'text-rank-silver', bg: 'bg-rank-silver/10', border: 'border-rank-silver/30', label: '실버' },
  gold: { color: 'text-rank-gold', bg: 'bg-rank-gold/10', border: 'border-rank-gold/30', label: '골드' },
  platinum: { color: 'text-rank-platinum', bg: 'bg-rank-platinum/10', border: 'border-rank-platinum/30', label: '플래티넘' },
  diamond: { color: 'text-rank-diamond', bg: 'bg-rank-diamond/10', border: 'border-rank-diamond/30', label: '다이아몬드', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]' },
};

const sizeConfig = {
  sm: { icon: 14, text: 'text-xs', padding: 'px-1.5 py-0.5' },
  md: { icon: 16, text: 'text-sm', padding: 'px-2 py-1' },
  lg: { icon: 24, text: 'text-base font-bold', padding: 'px-3 py-1.5' },
};

export function RankBadge({ tier, size = 'md', showLabel = true }: RankBadgeProps) {
  const config = tierConfig[tier];
  const s = sizeConfig[size];
  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${s.padding} ${(config as any).glow || ''}`}>
      <Shield size={s.icon} className={config.color} fill="currentColor" fillOpacity={0.2} />
      {showLabel && (
        <span className={`${config.color} ${s.text} font-medium tracking-wide`}>{config.label}</span>
      )}
    </div>
  );
}
