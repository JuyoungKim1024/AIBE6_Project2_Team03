'use client';

import { useEffect, useState } from 'react';
import { Pin } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { SupportLayout } from '@/components/support/SupportLayout';

type Notice = { id: string; title: string; content: string; pinned: boolean; createdAt: string };

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/notices`)
      .then((response) => response.ok ? response.json() : [])
      .then(setNotices)
      .finally(() => setLoading(false));
  }, []);

  return (
    <SupportLayout title="공지사항" description="서비스 업데이트와 중요한 운영 안내를 확인하세요." currentPath="/notices">
      <div className="space-y-3">
        {loading ? <p className="text-sm text-text-muted">공지사항을 불러오는 중입니다...</p> : notices.length === 0 ? (
          <div className="bg-surface border border-border rounded-xl p-8 text-sm text-text-muted">등록된 공지사항이 없습니다.</div>
        ) : notices.map((notice) => (
          <section key={notice.id} className="bg-surface border border-border rounded-xl overflow-hidden">
            <button type="button" onClick={() => setOpenId(openId === notice.id ? null : notice.id)} className="w-full flex items-center justify-between gap-4 p-5 text-left">
              <span className="flex items-center gap-2 min-w-0">
                {notice.pinned && <Pin size={15} className="text-primary shrink-0" />}
                <span className="font-bold text-text-primary truncate">{notice.title}</span>
              </span>
              <span className="text-xs text-text-muted shrink-0">{new Date(notice.createdAt).toLocaleDateString('ko-KR')}</span>
            </button>
            {openId === notice.id && <div className="px-5 pb-5 pt-1 border-t border-border whitespace-pre-wrap text-sm text-text-secondary leading-7">{notice.content}</div>}
          </section>
        ))}
      </div>
    </SupportLayout>
  );
}
