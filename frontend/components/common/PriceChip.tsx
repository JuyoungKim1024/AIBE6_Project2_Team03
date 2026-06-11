'use client';

import React from 'react';

interface PriceChipProps {
  price?: number;
  minPrice?: number;
  maxPrice?: number;
  hidden?: boolean;
  display?: 'list' | 'detail';
  unit?: string;
  variant?: 'default' | 'highlighted' | 'muted';
  className?: string;
}

export function PriceChip({
  price,
  minPrice,
  maxPrice,
  hidden = false,
  display = 'detail',
  unit = '분',
  variant = 'default',
  className = '',
}: PriceChipProps) {
  if (hidden || (price === undefined && minPrice === undefined)) {
    return (
      <div className={`inline-flex items-center rounded-full bg-surface border border-transparent px-3 py-1 text-text-secondary opacity-70 text-sm font-medium tracking-tight ${className}`}>
        단가 미공개
      </div>
    );
  }

  const basePrice = minPrice ?? price;
  if (basePrice === undefined) return null;

  const formattedMin = new Intl.NumberFormat('ko-KR').format(basePrice);
  const formattedMax = maxPrice ? new Intl.NumberFormat('ko-KR').format(maxPrice) : null;

  const variants = {
    default: 'bg-surface-elevated border-border text-text-primary',
    highlighted: 'bg-primary/10 border-primary/30 text-primary',
    muted: 'bg-surface border-transparent text-text-secondary opacity-70',
  };

  return (
    <div className={`inline-flex items-center rounded-full border px-3 py-1 font-mono text-sm font-medium tracking-tight ${variants[variant]} ${className}`}>
      <span className="mr-0.5 font-sans text-xs opacity-70">₩</span>
      {formattedMin}
      {display === 'list' ? '~' : formattedMax ? ` ~ ₩${formattedMax}` : '~'}
      <span className="ml-1 font-sans text-xs opacity-70">/{unit}</span>
    </div>
  );
}
