'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  partnerName: string;
  partnerId?: string;
  size?: 'sm' | 'lg';
  dropdownPosition?: 'above' | 'below';
  allowProfileView?: boolean;
}

export function PartnerAvatarDropdown({
  partnerName,
  partnerId,
  size = 'sm',
  dropdownPosition = 'above',
  allowProfileView = true,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sizeClass = size === 'lg' ? 'h-10 w-10 text-sm' : 'h-8 w-8 text-xs';
  const positionClass = dropdownPosition === 'below' ? 'top-12 left-0' : 'bottom-10 left-0';

  return (
    <div className="relative flex-shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`flex ${sizeClass} items-center justify-center rounded-full border border-border bg-surface-elevated font-bold text-text-secondary hover:ring-2 hover:ring-primary/40 transition-all`}
        aria-label="상대방 프로필"
      >
        {(partnerName ?? '?')[0].toUpperCase()}
      </button>

      {open && (
        <div className={`absolute ${positionClass} z-50 min-w-[140px] overflow-hidden rounded-xl border border-border bg-surface shadow-lg`}>
          {allowProfileView && (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  router.push(partnerId ? `/profile/${partnerId}` : '/');
                }}
                disabled={!partnerId}
                className="w-full px-4 py-2.5 text-left text-sm text-text-primary hover:bg-surface-elevated transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                상세 프로필 보기
              </button>
              <div className="h-px bg-border" />
            </>
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              router.push('/report');
            }}
            className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-surface-elevated transition-colors"
          >
            신고하기
          </button>
        </div>
      )}
    </div>
  );
}
