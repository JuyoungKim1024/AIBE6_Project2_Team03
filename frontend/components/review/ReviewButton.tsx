'use client';

import { useEffect, useState } from 'react';
import { Star, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { getAccessToken } from '@/lib/auth-session';

type Props = {
  projectId: string;
  submitted?: boolean;
  onSubmitted?: () => void;
  compact?: boolean;
};

export function ReviewButton({ projectId, submitted = false, onSubmitted, compact = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(submitted);
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setIsSubmitted(submitted), [submitted]);

  useEffect(() => {
    const handleSubmitted = (event: Event) => {
      const detail = (event as CustomEvent<{ projectId: string }>).detail;
      if (detail?.projectId === projectId) setIsSubmitted(true);
    };
    window.addEventListener('projectReviewSubmitted', handleSubmitted);
    return () => window.removeEventListener('projectReviewSubmitted', handleSubmitted);
  }, [projectId]);

  const submitReview = async () => {
    const token = getAccessToken();
    if (!token || isSaving) return;
    setIsSaving(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, rating, content }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '리뷰를 등록하지 못했습니다.');
      setIsSubmitted(true);
      setIsOpen(false);
      window.dispatchEvent(new CustomEvent('projectReviewSubmitted', { detail: { projectId } }));
      onSubmitted?.();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '리뷰를 등록하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isSubmitted) {
    return <span className="inline-flex items-center gap-1 text-xs font-bold text-green-500"><Star size={13} className="fill-current" />리뷰 완료</span>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary font-bold text-white hover:bg-primary/90 ${compact ? 'px-2.5 py-1.5 text-xs' : 'px-3 py-2 text-sm'}`}
      >
        <Star size={14} />리뷰 작성
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <button type="button" className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => !isSaving && setIsOpen(false)} aria-label="리뷰 닫기" />
          <div className="relative w-full max-w-md rounded-xl border border-border bg-surface p-6 shadow-2xl">
            <button type="button" onClick={() => setIsOpen(false)} disabled={isSaving} className="absolute right-4 top-4 text-text-muted hover:text-text-primary" aria-label="닫기">
              <X size={20} />
            </button>
            <h2 className="text-lg font-bold text-text-primary">프로젝트 리뷰</h2>
            <p className="mt-1 text-sm text-text-secondary">에디터의 작업 경험을 평가해주세요.</p>
            <div className="mt-5 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((score) => (
                <div key={score} className="relative h-8 w-8">
                  <Star size={32} className="text-border" />
                  <span
                    className="pointer-events-none absolute left-0 top-0 h-8 overflow-hidden"
                    style={{ width: `${Math.max(0, Math.min(1, rating - (score - 1))) * 100}%` }}
                  >
                    <Star size={32} className="min-w-8 fill-amber-400 text-amber-400" />
                  </span>
                  <button type="button" onClick={() => setRating(score - 0.5)} className="absolute inset-y-0 left-0 w-1/2" aria-label={`${score - 0.5}점`} />
                  <button type="button" onClick={() => setRating(score)} className="absolute inset-y-0 right-0 w-1/2" aria-label={`${score}점`} />
                </div>
              ))}
            </div>
            <p className="mt-2 text-center text-sm font-bold text-text-primary">{rating.toFixed(1)}점</p>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value.slice(0, 1000))}
              rows={4}
              placeholder="작업 품질, 소통, 일정 준수 등에 대한 리뷰를 작성해주세요. (선택)"
              className="form-input mt-5 resize-none"
            />
            <div className="mt-1 text-right text-xs text-text-muted">{content.length}/1000</div>
            {error && <p className="mt-3 text-sm font-bold text-accent">{error}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" onClick={() => setIsOpen(false)} disabled={isSaving} className="flex-1 rounded-xl bg-surface-elevated py-3 text-sm font-bold text-text-primary disabled:opacity-50">취소</button>
              <button type="button" onClick={submitReview} disabled={isSaving} className="flex-1 rounded-xl bg-primary py-3 text-sm font-bold text-white disabled:opacity-50">{isSaving ? '등록 중...' : '리뷰 등록'}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
