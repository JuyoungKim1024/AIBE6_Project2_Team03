'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Check, Loader2, Send } from 'lucide-react';
import Link from 'next/link';
import type { BlindEditor } from '@/types/matching';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export default function EditorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [editor, setEditor] = useState<BlindEditor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [requestStatus, setRequestStatus] = useState<RequestStatus>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/matching/editors/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(setEditor)
      .catch(() => setErrorMsg('에디터 정보를 불러올 수 없습니다.'))
      .finally(() => setIsLoading(false));
  }, [id]);

  const handleRequest = async () => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setRequestStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/matching/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ editorId: id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message ?? '요청에 실패했습니다.');
      }

      setRequestStatus('success');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : '요청에 실패했습니다.');
      setRequestStatus('error');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!editor) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-text-secondary">{errorMsg || '에디터를 찾을 수 없습니다.'}</p>
        <Link href="/matching" className="text-primary font-bold hover:underline">← 매칭으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <Link href="/matching" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft size={16} />
          매칭으로 돌아가기
        </Link>

        <div className="bg-surface border border-border rounded-2xl overflow-hidden shadow-xl">
          {/* 블라인드 배지 */}
          <div className="px-6 pt-6 pb-2 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-surface-elevated border border-border text-xs font-bold text-text-secondary">
              블라인드 프로필
            </span>
            <span className="text-xs text-text-muted">수락 후 닉네임과 채팅이 공개됩니다.</span>
          </div>

          {/* 포트폴리오 갤러리 */}
          {editor.thumbnails.length > 0 ? (
            <div className={`grid gap-0.5 bg-border mx-6 mt-4 rounded-xl overflow-hidden ${editor.thumbnails.length >= 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {editor.thumbnails.map((thumb, i) => (
                <img
                  key={i}
                  src={thumb}
                  alt={`포트폴리오 ${i + 1}`}
                  className="w-full aspect-video object-cover"
                />
              ))}
            </div>
          ) : (
            <div className="mx-6 mt-4 rounded-xl bg-surface-elevated border border-border aspect-video flex items-center justify-center">
              <p className="text-sm text-text-muted">포트폴리오 이미지가 없습니다.</p>
            </div>
          )}

          {/* 정보 */}
          <div className="p-6 space-y-6">
            {/* 카테고리 태그 */}
            {editor.categories.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">작업 분야</p>
                <div className="flex flex-wrap gap-2">
                  {editor.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 콘텐츠 유형 태그 */}
            {editor.videoLengths && editor.videoLengths.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">콘텐츠 유형</p>
                <div className="flex flex-wrap gap-2">
                  {editor.videoLengths.map((v) => (
                    <span key={v} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 툴 태그 */}
            {editor.tools.length > 0 && (
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">사용 툴</p>
                <div className="flex flex-wrap gap-2">
                  {editor.tools.map((tool) => (
                    <span key={tool} className="px-3 py-1 rounded-full bg-surface-elevated border border-border text-sm text-text-secondary">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* 단가 */}
            <div className="rounded-xl bg-surface-elevated border border-border p-4 flex items-center justify-between">
              <span className="text-sm font-bold text-text-primary">예상 단가</span>
              <span className="font-bold text-text-primary">
                ₩{new Intl.NumberFormat('ko-KR').format(editor.matchPriceMin ?? 0)} ~ ₩{new Intl.NumberFormat('ko-KR').format(editor.matchPriceMax ?? 0)}
                <span className="text-xs text-text-muted font-normal ml-1">원/{editor.matchPriceUnit}</span>
              </span>
            </div>

            {/* 매칭 요청 버튼 */}
            {requestStatus === 'success' ? (
              <div className="flex items-center justify-center gap-2 py-4 rounded-xl bg-primary/10 text-primary font-bold">
                <Check size={18} />
                매칭 요청이 전송되었습니다. 에디터의 수락을 기다려주세요.
              </div>
            ) : (
              <button
                onClick={handleRequest}
                disabled={requestStatus === 'loading'}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${
                  requestStatus === 'loading'
                    ? 'bg-surface-elevated text-text-muted cursor-not-allowed'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                }`}
              >
                {requestStatus === 'loading' ? (
                  <><Loader2 size={18} className="animate-spin" />요청 중...</>
                ) : (
                  <><Send size={18} />매칭 요청하기</>
                )}
              </button>
            )}

            {requestStatus === 'error' && errorMsg && (
              <p className="text-sm text-accent text-center">{errorMsg}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
