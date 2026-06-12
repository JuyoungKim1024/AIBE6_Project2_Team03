'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';

type SearchCategory = 'jobs' | 'community';

const categoryOptions: { value: SearchCategory; label: string }[] = [
  { value: 'jobs', label: '구인구직' },
  { value: 'community', label: '커뮤니티' },
];

function getDefaultCategory(pathname: string): SearchCategory {
  if (pathname.startsWith('/community')) return 'community';
  return 'jobs';
}

export function SearchBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>(getDefaultCategory(pathname));
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 페이지 이동 시 카테고리 자동 전환
  useEffect(() => {
    setCategory(getDefaultCategory(pathname));
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/${category}?q=${encodeURIComponent(query.trim())}`);
  };

  const selectedLabel = categoryOptions.find((o) => o.value === category)?.label ?? '구인구직';

  return (
    <form
      onSubmit={handleSearch}
      className="flex items-center bg-surface-elevated border border-border rounded-xl overflow-visible h-9"
    >
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-1 px-3 h-9 text-sm text-text-secondary border-r border-border hover:bg-surface transition-colors whitespace-nowrap rounded-l-xl"
        >
          {selectedLabel}
          <ChevronDown size={13} className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-28 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
            {categoryOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => { setCategory(option.value); setDropdownOpen(false); }}
                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                  category === option.value
                    ? 'text-primary bg-primary/10'
                    : 'text-text-secondary hover:bg-surface-elevated'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색어를 입력하세요"
        className="w-48 px-3 h-9 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
      />

      <button
        type="submit"
        className="px-3 h-9 text-text-muted hover:text-text-primary transition-colors"
        aria-label="검색"
      >
        <Search size={16} />
      </button>
    </form>
  );
}
