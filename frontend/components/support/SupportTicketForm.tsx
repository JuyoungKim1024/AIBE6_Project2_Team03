'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

export function SupportTicketForm({ type }: { type: 'inquiries' | 'reports' }) {
  const router = useRouter();
  const isReport = type === 'reports';
  const [category, setCategory] = useState(isReport ? '사용자 신고' : '서비스 이용');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const token = localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/support/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category, title, content, targetUrl: targetUrl || null }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '접수에 실패했습니다.');
      setTitle('');
      setContent('');
      setTargetUrl('');
      setMessage(isReport ? '신고가 접수되었습니다.' : '문의가 접수되었습니다.');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '접수에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = isReport
    ? ['사용자 신고', '게시글 신고', '댓글 신고', '포트폴리오 신고', '거래 신고', '기타']
    : ['서비스 이용', '계정·로그인', '결제·포인트', '매칭·프로젝트', '오류 신고', '기타'];

  return (
    <form onSubmit={submit} className="bg-surface border border-border rounded-xl p-6 sm:p-8 space-y-5">
      <label className="block">
        <span className="block text-sm font-bold text-text-primary mb-2">유형</span>
        <select value={category} onChange={(event) => setCategory(event.target.value)} className="form-input">
          {categories.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="block text-sm font-bold text-text-primary mb-2">제목</span>
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="form-input" maxLength={200} required />
      </label>
      {isReport && (
        <label className="block">
          <span className="block text-sm font-bold text-text-primary mb-2">대상 주소</span>
          <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} placeholder="게시글 또는 프로필 주소" className="form-input" />
        </label>
      )}
      <label className="block">
        <span className="block text-sm font-bold text-text-primary mb-2">내용</span>
        <textarea value={content} onChange={(event) => setContent(event.target.value)} className="form-input min-h-48 resize-y" required />
      </label>
      {message && <p className="text-sm font-bold text-primary">{message}</p>}
      {error && <p className="text-sm font-bold text-accent">{error}</p>}
      <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-white text-sm font-bold disabled:opacity-50">
        <Send size={16} />{submitting ? '접수 중...' : '접수하기'}
      </button>
    </form>
  );
}
