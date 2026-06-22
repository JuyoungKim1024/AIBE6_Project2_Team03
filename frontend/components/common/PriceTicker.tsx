'use client';

import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface PriceItem {
  label: string;
  price: number;
  unit: string;
}

const REPEAT = 10;
const SPEED_PX_PER_SEC = 60; // 60px/s — Hz 무관 일정 속도

function formatPrice(price: number) {
  return new Intl.NumberFormat('ko-KR').format(price);
}

export function PriceTicker() {
  const [paused, setPaused] = useState(false);
  const [prices, setPrices] = useState<PriceItem[]>([]);
  const innerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const offsetRef = useRef(0);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/market/prices`)
      .then((r) => r.ok ? r.json() : [])
      .then((data: { label: string; price: number; unit: string }[]) =>
        setPrices(data.map((d) => ({ label: d.label, price: d.price, unit: d.unit })))
      )
      .catch(() => {});
  }, []);

  useEffect(() => { pausedRef.current = paused; }, [paused]);

  useEffect(() => {
    if (prices.length === 0) return;

    const inner = innerRef.current;
    if (!inner) return;

    let animId: number;
    let measureId: number;

    measureId = requestAnimationFrame(() => {
      const singleWidth = inner.scrollWidth / REPEAT;
      let lastTime: number | null = null;

      function step(now: number) {
        if (!pausedRef.current) {
          const delta = lastTime != null ? (now - lastTime) / 1000 : 0;
          offsetRef.current += SPEED_PX_PER_SEC * delta;
          if (offsetRef.current >= singleWidth) offsetRef.current -= singleWidth;
          inner!.style.transform = `translateX(-${offsetRef.current}px)`;
        }
        lastTime = now;
        animId = requestAnimationFrame(step);
      }

      animId = requestAnimationFrame(step);
    });

    return () => { cancelAnimationFrame(measureId); cancelAnimationFrame(animId); };
  }, [prices]);

  if (prices.length === 0) return null;

  const items = Array.from({ length: REPEAT }, () => prices).flat();

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
