'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ChevronDown, Search, X } from 'lucide-react';

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
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [category, setCategory] = useState<SearchCategory>(getDefaultCategory(pathname));
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCategory(getDefaultCategory(pathname));
    setQuery(searchParams.get('q') ?? '');
  }, [pathname, searchParams]);

  // 외부 클릭 시 카테고리 드롭다운 닫기
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // ESC 키 처리
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (categoryDropdownOpen) {
          setCategoryDropdownOpen(false);
        } else if (query) {
          setQuery('');
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [categoryDropdownOpen, query]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;
    inputRef.current?.blur();
    const target = `/${category}?q=${encodeURIComponent(trimmed)}`;
    router.push(target);
    router.refresh();
  };

  const selectedLabel = categoryOptions.find((o) => o.value === category)?.label ?? '구인구직';

  return (
    <div className="relative" ref={containerRef}>
      <form
        onSubmit={handleSearch}
        className="flex items-center bg-surface-elevated border border-border rounded-xl overflow-visible h-9"
      >
        {/* 카테고리 드롭다운 */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
            className="flex items-center gap-1 px-3 h-9 text-sm text-text-secondary border-r border-border hover:bg-surface transition-colors whitespace-nowrap rounded-l-xl"
          >
            {selectedLabel}
            <ChevronDown size={13} className={`transition-transform ${categoryDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {categoryDropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-50">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => { setCategory(option.value); setCategoryDropdownOpen(false); }}
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

        {/* 검색 입력 */}
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="검색어를 입력하세요"
          className="w-48 px-3 h-9 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
        />

        {/* 입력 초기화 버튼 */}
        {query && (
          <button
            type="button"
            onClick={() => { setQuery(''); inputRef.current?.focus(); }}
            className="px-1 h-9 text-text-muted hover:text-text-primary transition-colors"
            aria-label="검색어 지우기"
          >
            <X size={14} />
          </button>
        )}

        {/* 검색 버튼 */}
        <button
          type="submit"
          className="px-3 h-9 text-text-muted hover:text-text-primary transition-colors"
          aria-label="검색"
        >
          <Search size={16} />
        </button>
      </form>
    </div>
  );
}
