'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShieldOff, ShieldCheck, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type AdminUser = {
  id: string;
  email: string | null;
  nickname: string;
  provider: string;
  role: string | null;
  admin: boolean;
  testAccount: boolean;
  deleted: boolean;
  suspended: boolean;
  suspendedUntil: string | null;
  suspensionReason: string | null;
  remainingMinutes: number;
  createdAt: string;
};

type AdminPost = {
  id: string;
  boardType: string;
  title: string;
  authorNickname: string;
  authorDeleted: boolean;
  commentCount: number;
  createdAt: string;
};

type AdminComment = {
  id: string;
  postId: string;
  postTitle: string;
  writerNickname: string;
  writerDeleted: boolean;
  content: string;
  createdAt: string;
};

function authHeaders(json = false) {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}`,
  };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.message ?? '요청 처리에 실패했습니다.');
  }
  return data as T;
}

function remainingText(minutes: number) {
  const totalHours = Math.max(1, Math.ceil(minutes / 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  return days > 0 ? `${days}일${hours > 0 ? ` ${hours}시간` : ''}` : `${totalHours}시간`;
}

export function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [query, setQuery] = useState('');
  const [targetId, setTargetId] = useState<string | null>(null);
  const [duration, setDuration] = useState('24');
  const [unit, setUnit] = useState<'HOURS' | 'DAYS'>('HOURS');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');

  const load = () => fetch(`${API_BASE_URL}/api/admin/users`, { headers: authHeaders() })
    .then((response) => readResponse<AdminUser[]>(response))
    .then(setUsers)
    .catch((error) => setMessage(error.message));

  useEffect(() => { load(); }, []);

  const filteredUsers = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return users;
    return users.filter((user) =>
      user.nickname.toLowerCase().includes(keyword)
      || user.email?.toLowerCase().includes(keyword)
      || user.id.toLowerCase().includes(keyword));
  }, [query, users]);

  const suspend = async (userId: string) => {
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspension`, {
        method: 'POST',
        headers: authHeaders(true),
        body: JSON.stringify({ duration: Number(duration), unit, reason }),
      });
      await readResponse<AdminUser>(response);
      setTargetId(null);
      setReason('');
      setMessage('계정을 임시 제한했습니다.');
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '계정 제한에 실패했습니다.');
    }
  };

  const lift = async (userId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}/suspension`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      await readResponse<AdminUser>(response);
      setMessage('계정 제한을 해제했습니다.');
      load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '제한 해제에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative max-w-md w-full">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="닉네임, 이메일, 사용자 ID 검색"
            className="form-input pl-9"
          />
        </div>
        <span className="text-sm text-text-muted">전체 {users.length}명</span>
      </div>

      {message && <p className="text-sm font-bold text-primary">{message}</p>}

      <div className="space-y-3">
        {filteredUsers.map((user) => (
          <section key={user.id} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-text-primary">{user.nickname}</h3>
                  {user.admin && <Badge text="관리자" className="bg-primary/10 text-primary" />}
                  {user.testAccount && <Badge text="테스트" className="bg-cyan-500/10 text-cyan-500" />}
                  {user.deleted && <Badge text="탈퇴" className="bg-surface-elevated text-text-muted" />}
                  {user.suspended && <Badge text="임시 제한" className="bg-accent/10 text-accent" />}
                  {user.role && <Badge text={user.role === 'EDITOR' ? '에디터' : '크리에이터'} className="bg-surface-elevated text-text-secondary" />}
                </div>
                <p className="mt-2 text-sm text-text-secondary">{user.email ?? '이메일 없음'} · {user.provider}</p>
                <p className="mt-1 text-xs text-text-muted break-all">{user.id}</p>
                {user.suspended && (
                  <p className="mt-2 text-sm text-accent">
                    해제까지 약 {remainingText(user.remainingMinutes)}
                    {user.suspensionReason ? ` · ${user.suspensionReason}` : ''}
                  </p>
                )}
              </div>

              {!user.admin && !user.deleted && (
                <div className="shrink-0">
                  {user.suspended ? (
                    <button type="button" onClick={() => lift(user.id)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-primary/40 text-primary text-sm font-bold">
                      <ShieldCheck size={16} /> 제한 해제
                    </button>
                  ) : (
                    <button type="button" onClick={() => setTargetId(targetId === user.id ? null : user.id)} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-accent/40 text-accent text-sm font-bold">
                      <ShieldOff size={16} /> 임시 제한
                    </button>
                  )}
                </div>
              )}
            </div>

            {targetId === user.id && (
              <div className="mt-5 pt-5 border-t border-border grid grid-cols-1 md:grid-cols-[120px_120px_minmax(0,1fr)_auto] gap-3">
                <input type="number" min="1" value={duration} onChange={(event) => setDuration(event.target.value)} className="form-input" />
                <select value={unit} onChange={(event) => setUnit(event.target.value as 'HOURS' | 'DAYS')} className="form-input">
                  <option value="HOURS">시간</option>
                  <option value="DAYS">일</option>
                </select>
                <input value={reason} onChange={(event) => setReason(event.target.value)} placeholder="제한 사유" className="form-input" />
                <button type="button" onClick={() => suspend(user.id)} className="px-5 py-3 rounded-xl bg-accent text-white text-sm font-bold">
                  제한 적용
                </button>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}

export function AdminPostsPanel() {
  const [items, setItems] = useState<AdminPost[]>([]);
  const [message, setMessage] = useState('');
  const load = () => fetch(`${API_BASE_URL}/api/admin/posts`, { headers: authHeaders() })
    .then((response) => readResponse<AdminPost[]>(response))
    .then(setItems)
    .catch((error) => setMessage(error.message));
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!window.confirm('이 게시글을 삭제하시겠습니까?')) return;
    const response = await fetch(`${API_BASE_URL}/api/admin/posts/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage('게시글을 삭제했습니다.');
    } else {
      setMessage('게시글 삭제에 실패했습니다.');
    }
  };

  return <ContentList message={message} empty="등록된 게시글이 없습니다.">
    {items.map((item) => (
      <ContentRow
        key={item.id}
        title={item.title}
        meta={`${item.boardType === 'JOB' ? '구인구직' : '커뮤니티'} · ${item.authorNickname}${item.authorDeleted ? ' (탈퇴 회원)' : ''} · 댓글 ${item.commentCount}개 · ${new Date(item.createdAt).toLocaleString('ko-KR')}`}
        onDelete={() => remove(item.id)}
      />
    ))}
  </ContentList>;
}

export function AdminCommentsPanel() {
  const [items, setItems] = useState<AdminComment[]>([]);
  const [message, setMessage] = useState('');
  const load = () => fetch(`${API_BASE_URL}/api/admin/comments`, { headers: authHeaders() })
    .then((response) => readResponse<AdminComment[]>(response))
    .then(setItems)
    .catch((error) => setMessage(error.message));
  useEffect(() => { load(); }, []);

  const remove = async (id: string) => {
    if (!window.confirm('이 댓글을 삭제하시겠습니까?')) return;
    const response = await fetch(`${API_BASE_URL}/api/admin/comments/${id}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (response.ok) {
      setItems((current) => current.filter((item) => item.id !== id));
      setMessage('댓글을 삭제했습니다.');
    } else {
      setMessage('댓글 삭제에 실패했습니다.');
    }
  };

  return <ContentList message={message} empty="등록된 댓글이 없습니다.">
    {items.map((item) => (
      <ContentRow
        key={item.id}
        title={item.content}
        meta={`${item.postTitle} · ${item.writerNickname}${item.writerDeleted ? ' (탈퇴 회원)' : ''} · ${new Date(item.createdAt).toLocaleString('ko-KR')}`}
        onDelete={() => remove(item.id)}
      />
    ))}
  </ContentList>;
}

function Badge({ text, className }: { text: string; className: string }) {
  return <span className={`px-2 py-1 rounded text-xs font-bold ${className}`}>{text}</span>;
}

function ContentList({ children, message, empty }: { children: React.ReactNode; message: string; empty: string }) {
  const hasChildren = Array.isArray(children) ? children.length > 0 : Boolean(children);
  return (
    <div className="space-y-3">
      {message && <p className="text-sm font-bold text-primary">{message}</p>}
      {hasChildren ? children : <div className="bg-surface border border-border rounded-xl p-8 text-sm text-text-muted">{empty}</div>}
    </div>
  );
}

function ContentRow({ title, meta, onDelete }: { title: string; meta: string; onDelete: () => void }) {
  return (
    <section className="bg-surface border border-border rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        <h3 className="font-bold text-text-primary break-words">{title}</h3>
        <p className="mt-2 text-xs text-text-muted">{meta}</p>
      </div>
      <button type="button" onClick={onDelete} title="삭제" className="w-9 h-9 shrink-0 rounded-lg border border-border text-text-muted hover:text-accent hover:border-accent/40 flex items-center justify-center">
        <Trash2 size={16} />
      </button>
    </section>
  );
}
