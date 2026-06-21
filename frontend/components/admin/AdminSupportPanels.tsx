'use client';

import { useEffect, useState } from 'react';
import { Check, Pencil, Plus, Save, Trash2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type Notice = { id: string; title: string; content: string; pinned: boolean; published: boolean; createdAt: string };
type Ticket = {
  id: string; category: string; title: string; content: string; targetUrl: string | null;
  status: string; adminNote: string | null; userNickname: string; userEmail: string | null; createdAt: string;
};

function authHeaders(json = false) {
  const headers: Record<string, string> = { Authorization: `Bearer ${localStorage.getItem('accessToken') ?? ''}` };
  if (json) headers['Content-Type'] = 'application/json';
  return headers;
}

export function AdminNoticesPanel() {
  const [items, setItems] = useState<Notice[]>([]);
  const [editing, setEditing] = useState<Notice | null>(null);
  const [form, setForm] = useState({ title: '', content: '', pinned: false, published: true });
  const [message, setMessage] = useState('');

  const load = () => fetch(`${API_BASE_URL}/api/admin/notices`, { headers: authHeaders() })
    .then((response) => response.ok ? response.json() : [])
    .then(setItems);

  useEffect(() => { load(); }, []);

  const save = async () => {
    const response = await fetch(`${API_BASE_URL}/api/admin/notices${editing ? `/${editing.id}` : ''}`, {
      method: editing ? 'PATCH' : 'POST',
      headers: authHeaders(true),
      body: JSON.stringify(form),
    });
    if (!response.ok) {
      setMessage('공지사항 저장에 실패했습니다.');
      return;
    }
    setEditing(null);
    setForm({ title: '', content: '', pinned: false, published: true });
    setMessage('공지사항이 저장되었습니다.');
    load();
  };

  const remove = async (id: string) => {
    await fetch(`${API_BASE_URL}/api/admin/notices/${id}`, { method: 'DELETE', headers: authHeaders() });
    load();
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6">
      <section className="bg-surface border border-border rounded-xl p-6 h-fit">
        <h2 className="font-bold text-text-primary mb-4">{editing ? '공지 수정' : '공지 작성'}</h2>
        <div className="space-y-4">
          <input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="공지 제목" className="form-input" />
          <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="공지 내용" className="form-input min-h-56 resize-y" />
          <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={form.pinned} onChange={(event) => setForm({ ...form, pinned: event.target.checked })} /> 상단 고정</label>
          <label className="flex items-center gap-2 text-sm text-text-secondary"><input type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} /> 공개</label>
          <button type="button" onClick={save} className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-white text-sm font-bold">
            {editing ? <Save size={16} /> : <Plus size={16} />}{editing ? '수정 저장' : '공지 등록'}
          </button>
          {message && <p className="text-xs font-bold text-primary">{message}</p>}
        </div>
      </section>
      <section className="space-y-3">
        {items.length === 0 ? <Empty text="등록된 공지사항이 없습니다." /> : items.map((item) => (
          <div key={item.id} className="bg-surface border border-border rounded-xl p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-text-primary">{item.title}</h3>
                  {item.pinned && <span className="text-xs text-primary">고정</span>}
                  {!item.published && <span className="text-xs text-accent">비공개</span>}
                </div>
                <p className="text-sm text-text-secondary mt-2 whitespace-pre-wrap line-clamp-3">{item.content}</p>
              </div>
              <div className="flex gap-1">
                <button type="button" onClick={() => { setEditing(item); setForm({ title: item.title, content: item.content, pinned: item.pinned, published: item.published }); }} className="p-2 text-text-muted hover:text-primary"><Pencil size={16} /></button>
                <button type="button" onClick={() => remove(item.id)} className="p-2 text-text-muted hover:text-accent"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function AdminTicketsPanel({ type }: { type: 'INQUIRY' | 'REPORT' }) {
  const [items, setItems] = useState<Ticket[]>([]);

  const load = () => fetch(`${API_BASE_URL}/api/admin/tickets?type=${type}`, { headers: authHeaders() })
    .then((response) => response.ok ? response.json() : [])
    .then(setItems);

  useEffect(() => { load(); }, [type]);

  const update = async (ticket: Ticket, status: string, adminNote: string) => {
    const response = await fetch(`${API_BASE_URL}/api/admin/tickets/${ticket.id}`, {
      method: 'PATCH',
      headers: authHeaders(true),
      body: JSON.stringify({ status, adminNote }),
    });
    if (response.ok) load();
  };

  return (
    <div className="space-y-4">
      {items.length === 0 ? <Empty text={`접수된 ${type === 'INQUIRY' ? '문의' : '신고'}가 없습니다.`} /> : items.map((item) => (
        <TicketItem key={item.id} item={item} onSave={update} />
      ))}
    </div>
  );
}

function TicketItem({ item, onSave }: { item: Ticket; onSave: (ticket: Ticket, status: string, note: string) => void }) {
  const [status, setStatus] = useState(item.status);
  const [note, setNote] = useState(item.adminNote ?? '');
  return (
    <section className="bg-surface border border-border rounded-xl p-6">
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2 py-1 rounded bg-primary/10 text-primary text-xs font-bold">{item.category}</span>
            <h3 className="font-bold text-text-primary">{item.title}</h3>
          </div>
          <p className="text-xs text-text-muted mt-2">{item.userNickname} · {item.userEmail ?? '이메일 없음'} · {new Date(item.createdAt).toLocaleString('ko-KR')}</p>
          {item.targetUrl && <p className="text-xs text-text-muted mt-2 break-all">{item.targetUrl}</p>}
          <p className="text-sm text-text-secondary leading-7 whitespace-pre-wrap mt-4">{item.content}</p>
        </div>
        <div className="w-full lg:w-72 space-y-3 shrink-0">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="form-input">
            <option value="RECEIVED">접수</option>
            <option value="IN_PROGRESS">처리 중</option>
            <option value="COMPLETED">완료</option>
            <option value="REJECTED">반려</option>
          </select>
          <textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="관리자 메모" className="form-input min-h-24 resize-y" />
          <button type="button" onClick={() => onSave(item, status, note)} className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-white text-sm font-bold"><Check size={15} />처리 저장</button>
        </div>
      </div>
    </section>
  );
}

function Empty({ text }: { text: string }) {
  return <div className="bg-surface border border-border rounded-xl p-8 text-sm text-text-muted">{text}</div>;
}
