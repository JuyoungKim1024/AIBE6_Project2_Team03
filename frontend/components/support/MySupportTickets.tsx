'use client';

import { getAccessToken } from '@/lib/auth-session';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

type Ticket = {
  id: string;
  category: string;
  title: string;
  content: string;
  status: 'RECEIVED' | 'IN_PROGRESS' | 'COMPLETED' | 'REJECTED';
  adminNote: string | null;
  createdAt: string;
};

const statusLabel = {
  RECEIVED: '접수',
  IN_PROGRESS: '처리 중',
  COMPLETED: '답변 완료',
  REJECTED: '반려',
};

export function MySupportTickets({ type, refreshKey }: { type: 'INQUIRY' | 'REPORT'; refreshKey: number }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/api/support/my-tickets?type=${type}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((response) => response.ok ? response.json() : [])
      .then(setTickets)
      .finally(() => setLoading(false));
  }, [refreshKey, type]);

  return (
    <section className="mt-8">
      <h2 className="text-lg font-bold text-text-primary mb-4">내 접수 내역</h2>
      {loading ? (
        <p className="text-sm text-text-muted">접수 내역을 불러오는 중입니다...</p>
      ) : tickets.length === 0 ? (
        <div className="bg-surface border border-border rounded-xl p-6 text-sm text-text-muted">접수 내역이 없습니다.</div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <article key={ticket.id} className="bg-surface border border-border rounded-xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold">{ticket.category}</span>
                  <h3 className="font-bold text-text-primary">{ticket.title}</h3>
                </div>
                <span className="text-xs font-bold text-text-secondary">{statusLabel[ticket.status]}</span>
              </div>
              <p className="text-xs text-text-muted mt-2">{new Date(ticket.createdAt).toLocaleString('ko-KR')}</p>
              <p className="text-sm text-text-secondary whitespace-pre-wrap mt-4">{ticket.content}</p>
              {ticket.adminNote && (
                <div className="mt-4 border-l-2 border-primary bg-primary/5 px-4 py-3">
                  <div className="text-xs font-bold text-primary mb-1">관리자 답변</div>
                  <p className="text-sm text-text-secondary whitespace-pre-wrap">{ticket.adminNote}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
