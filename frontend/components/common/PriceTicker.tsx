'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';

interface PriceItem {
  label: string;
  price: number;
  unit: string;
}

// TODO: 백엔드 연동 후 GET /api/market/prices 호출로 교체
const mockPrices: PriceItem[] = [
  { label: '롱폼 편집 평균', price: 15000, unit: '분' },
  { label: '숏폼 편집 평균', price: 8500, unit: '분' },
  { label: '썸네일 제작 평균', price: 35000, unit: '건' },
  { label: '모션그래픽 평균', price: 22000, unit: '분' },
];

const REPEAT = 10;  // 복제 수 — 화면이 넓어도 항상 꽉 차게
const SPEED = 1;    // px per frame

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export function PriceTicker() {
  const [paused, setPaused] = useState(false);
  const innerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (mockPrices.length === 0) return;

    const inner = innerRef.current;
    if (!inner) return;

    // 레이아웃 확정 후 1세트 너비 한 번만 측정
    const singleWidth = inner.scrollWidth / REPEAT;
    let animId: number;

    function step() {
      if (!pausedRef.current) {
        offsetRef.current += SPEED;
        if (offsetRef.current >= singleWidth) offsetRef.current -= singleWidth;
        inner!.style.transform = `translateX(-${offsetRef.current}px)`;
      }
      animId = requestAnimationFrame(step);
    }

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, []);

  if (mockPrices.length === 0) return null;

  const items = Array.from({ length: REPEAT }, () => mockPrices).flat();

  return (
    <div
      className="w-full bg-surface border-b border-border overflow-hidden h-8 flex items-center select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-border h-full">
        <TrendingUp size={12} className="text-primary" />
        <span className="text-xs font-bold text-primary whitespace-nowrap">실시간 시세</span>
      </div>

      <div className="flex-1 overflow-hidden">
        <div
          ref={innerRef}
          className="flex items-center gap-8 whitespace-nowrap"
        >
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
              <span className="text-text-muted">{item.label}</span>
              <span className="font-mono font-bold text-text-primary">
                ₩{formatPrice(item.price)}
                <span className="font-sans font-normal text-text-muted">/{item.unit}</span>
              </span>
              <span className="text-border mx-4">|</span>
            </span>
          ))}
        </div>
      </div>

      {paused && (
        <div className="shrink-0 px-3 text-xs text-text-muted">일시정지</div>
      )}
    </div>
  );
}
