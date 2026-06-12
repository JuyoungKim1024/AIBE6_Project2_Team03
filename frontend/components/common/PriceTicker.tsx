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

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export function PriceTicker() {
  const [prices] = useState<PriceItem[]>(mockPrices);
  const [paused, setPaused] = useState(false);
  const [offset, setOffset] = useState(0);
  const animRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prices.length === 0) return;

    let start: number | null = null;
    const speed = 0.4; // px per ms

    function step(timestamp: number) {
      if (paused) {
        start = null;
        animRef.current = requestAnimationFrame(step);
        return;
      }

      if (start === null) start = timestamp - offset / speed;
      const elapsed = timestamp - start;
      const innerWidth = innerRef.current?.scrollWidth ?? 0;
      const half = innerWidth / 2;

      const next = (elapsed * speed) % half;
      setOffset(next);
      animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
    return () => {
      if (animRef.current !== null) cancelAnimationFrame(animRef.current);
    };
  }, [paused, prices]);

  if (prices.length === 0) return null;

  // 아이템을 2배로 복제해 무한 루프처럼 보이게 함
  const items = [...prices, ...prices];

  return (
    <div
      ref={containerRef}
      className="w-full bg-surface border-b border-border overflow-hidden h-8 flex items-center select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="flex items-center gap-2 px-3 shrink-0 border-r border-border h-full">
        <TrendingUp size={12} className="text-primary" />
        <span className="text-xs font-bold text-primary whitespace-nowrap">실시간 시세</span>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <div
          ref={innerRef}
          className="flex items-center gap-8 whitespace-nowrap"
          style={{ transform: `translateX(-${offset}px)` }}
        >
          {items.map((item, i) => (
            <span key={i} className="flex items-center gap-1.5 text-xs text-text-secondary shrink-0">
              <span className="text-text-muted">{item.label}</span>
              <span className="font-mono font-bold text-text-primary">
                ₩{formatPrice(item.price)}
                <span className="font-sans font-normal text-text-muted">/{item.unit}</span>
              </span>
              <span className="text-border mx-2">|</span>
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
