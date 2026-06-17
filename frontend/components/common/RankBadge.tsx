'use client';

import React from 'react';
import type { RankTier } from '@/types/user';

export type { RankTier };

interface RankBadgeProps {
  tier: RankTier;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

const tierConfig: Record<RankTier, { color: string; bg: string; border: string; label: string; icon: string; glow?: string }> = {
  bronze: { color: 'text-rank-bronze', bg: 'bg-rank-bronze/10', border: 'border-rank-bronze/30', label: '브론즈', icon: '/rank-icons/bronze-clean.png' },
  silver: { color: 'text-rank-silver', bg: 'bg-rank-silver/10', border: 'border-rank-silver/30', label: '실버', icon: '/rank-icons/silver-clean.png' },
  gold: { color: 'text-rank-gold', bg: 'bg-rank-gold/10', border: 'border-rank-gold/30', label: '골드', icon: '/rank-icons/gold-clean.png' },
  platinum: { color: 'text-rank-platinum', bg: 'bg-rank-platinum/10', border: 'border-rank-platinum/30', label: '플래티넘', icon: '/rank-icons/platinum-clean.png' },
  diamond: { color: 'text-rank-diamond', bg: 'bg-rank-diamond/10', border: 'border-rank-diamond/30', label: '다이아몬드', icon: '/rank-icons/diamond-clean.png', glow: 'shadow-[0_0_10px_rgba(6,182,212,0.5)]' },
};

const sizeConfig = {
  sm: { icon: 'w-6 h-6 -my-1', text: 'text-xs', padding: 'px-2 py-1' },
  md: { icon: 'w-8 h-8 -my-1.5', text: 'text-sm', padding: 'px-2.5 py-1.5' },
  lg: { icon: 'w-10 h-10 -my-2', text: 'text-base font-bold', padding: 'px-3 py-2' },
};

export function RankBadge({ tier, size = 'md', showLabel = true }: RankBadgeProps) {
  const config = tierConfig[tier];
  const s = sizeConfig[size];

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border ${config.bg} ${config.border} ${s.padding} ${config.glow || ''}`}>
      <img src={config.icon} alt={`${config.label} 등급`} className={`${s.icon} object-contain flex-shrink-0`} />
      {showLabel && (
        <span className={`${config.color} ${s.text} font-medium tracking-wide text-center leading-none`}>{config.label}</span>
      )}
    </div>
  );
}
