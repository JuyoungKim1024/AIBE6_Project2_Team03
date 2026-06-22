'use client';

import { getAccessToken } from '@/lib/auth-session';

import { FormEvent, useEffect, useRef, useState } from 'react';
import { Briefcase, Check, ChevronDown, Pencil, X } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import {
  ProjectMessageCard,
  serializeProjectMessage,
  type ProjectMessagePayload,
} from '@/components/common/ProjectMessageCard';
import type { ChatPostSummary } from '@/types/chat';
import { useModal } from '@/store/modalStore';

type ProjectAction = 'start' | 'reject' | 'complete' | 'cancel';

type ProjectForm = {
  field: string;
  price: string;
  workAmount: string;
  workUnit: 'MINUTE' | 'CASE';
  revisionCount: string;
  revisionUnlimited: boolean;
  deadlineDate: string;
  deadlineTime: string;
  memo: string;
};

type MyProject = ProjectMessagePayload & { partnerName?: string };
type MyProjects = { received: unknown[]; ongoing: MyProject[] };

type Props = {
  roomId: string;
  userId: string | null;
  project: ProjectMessagePayload | null;
  post: ChatPostSummary | null;
  onProjectChange: (project: ProjectMessagePayload | null) => void;
  publishMessage: (message: { senderId: string; content: string; messageType: 'TEXT' }) => boolean;
};

const emptyForm: ProjectForm = {
  field: '',
  price: '',
  workAmount: '',
  workUnit: 'MINUTE',
  revisionCount: '',
  revisionUnlimited: false,
  deadlineDate: '',
  deadlineTime: '',
  memo: '',
};
const visibleStatuses = ['WAITING', 'WORKING', 'COMPLETION_PENDING', 'CANCELLATION_PENDING', 'COMPLETED', 'REJECTED', 'CANCELED'];

function getTomorrowMin() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function ChatProjectPanel({ roomId, userId, project, post, onProjectChange, publishMessage }: Props) {
  const { confirmModal } = useModal();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAction, setActiveAction] = useState<ProjectAction | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const minDeadline = getTomorrowMin();
  const accessToken = typeof window === 'undefined' ? null : getAccessToken();
  const isOpenProject = project ? ['WAITING', 'WORKING', 'COMPLETION_PENDING', 'CANCELLATION_PENDING'].includes(project.status) : false;

  const request = async <T,>(path: string, init?: RequestInit) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...(init?.headers ?? {}),
      },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.message ?? '요청을 처리하지 못했습니다.');
    }
    if (response.status === 204) return null as T;
    return response.json() as Promise<T>;
  };

  const refreshPointBalance = () => {
    request<{ point: number; safePaymentPoint: number }>('/api/point')
      .then((data) => {
        window.dispatchEvent(new CustomEvent('pointBalanceUpdated', { detail: data }));
      })
      .catch(() => {});
  };

  useEffect(() => {
    let isActive = true;

    request<ProjectMessagePayload>(`/api/projects/rooms/${roomId}`)
      .catch(async () => {
        const data = await request<MyProjects>('/api/users/me/projects');
        return data.ongoing.find((item) => item.roomId === roomId && visibleStatuses.includes(item.status)) ?? null;
      })
      .then((result) => {
        if (isActive) onProjectChange(result);
      })
      .catch(() => {
        if (isActive) onProjectChange(null);
      });

    return () => { isActive = false; };
  }, [roomId]);

  // 포인트에 영향을 주는 상태 전환 시 양쪽 모두 잔액 갱신
  // (상대방 액션으로 WebSocket을 통해 project prop이 바뀔 때도 포함)
  const prevStatusRef = useRef<string | null>(null);
  useEffect(() => {
    if (!project) return;
    const prev = prevStatusRef.current;
    prevStatusRef.current = project.status;
    const balanceAffectingStatuses = ['WORKING', 'COMPLETED', 'CANCELED'];
    if (prev !== null && prev !== project.status && balanceAffectingStatuses.includes(project.status)) {
      refreshPointBalance();
    }
  }, [project?.status]);

  const openCreateForm = () => {
    setIsEditing(false);
    setForm({
      ...emptyForm,
      field: post?.fieldTags.join(', ') ?? '',
      revisionCount: post?.revisionCount == null ? '' : String(post.revisionCount),
      revisionUnlimited: Boolean(post && post.revisionCount == null),
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const openEditForm = () => {
    if (!project) return;
    setIsEditing(true);
    setForm({
      field: project.field ?? '',
      price: project.price ? String(project.price) : '',
      workAmount: project.workAmount || project.videoLength ? String(project.workAmount ?? project.videoLength) : '',
      workUnit: project.workUnit ?? 'MINUTE',
      revisionCount: String(project.revisionCount ?? 0),
      revisionUnlimited: project.revisionUnlimited ?? false,
      deadlineDate: project.deadline?.slice(0, 10) ?? '',
      deadlineTime: project.deadline?.slice(11, 16) ?? '',
      memo: project.memo ?? '',
    });
    setErrorMessage('');
    setIsFormOpen(true);
  };

  const saveProject = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || isSaving) return;
    if (!form.field.trim() || !form.price || !form.workAmount || (!form.revisionUnlimited && !form.revisionCount) || !form.deadlineDate || !form.deadlineTime) {
      setErrorMessage('메모를 제외한 모든 항목을 입력해주세요.');
      return;
    }
    const deadline = `${form.deadlineDate}T${form.deadlineTime}`;
    if (deadline < minDeadline) {
      setErrorMessage('마감일은 내일 이후로 설정해주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');
    try {
      const saved = await request<ProjectMessagePayload>(isEditing && project ? `/api/projects/${project.id}` : '/api/projects', {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(!isEditing ? { roomId } : {}),
          field: form.field.trim(),
          price: form.price ? Number(form.price) : null,
          workAmount: form.workAmount ? Number(form.workAmount) : null,
          workUnit: form.workUnit,
          revisionCount: form.revisionUnlimited ? 0 : Number(form.revisionCount),
          revisionUnlimited: form.revisionUnlimited,
          deadline,
          memo: form.memo.trim(),
        }),
      });

      onProjectChange(saved);
      if (!isEditing) {
        const published = publishMessage({
          senderId: userId,
          content: serializeProjectMessage(saved),
          messageType: 'TEXT',
        });
        if (!published) throw new Error('프로젝트는 생성됐지만 채팅 카드를 전송하지 못했습니다.');
      }
      setIsFormOpen(false);
      setForm(emptyForm);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트를 저장하지 못했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const changeStatus = async (action: ProjectAction) => {
    if (!project || activeAction) return;
    const labels: Record<ProjectAction, string> = {
      start: '프로젝트를 수락하시겠습니까?',
      reject: '프로젝트를 거절하시겠습니까?',
      complete: '프로젝트 완료를 처리하시겠습니까?',
      cancel: project.status === 'CANCELLATION_PENDING'
        ? '상대방의 프로젝트 취소 요청을 확인하시겠습니까?'
        : '프로젝트 취소를 요청하시겠습니까?',
    };
    const confirmed = await confirmModal({
      title: '프로젝트 상태 변경',
      message: labels[action],
      confirmLabel: '확인',
    });
    if (!confirmed) return;

    setActiveAction(action);
    setErrorMessage('');
    try {
      const saved = await request<ProjectMessagePayload>(`/api/projects/${project.id}/${action}`, { method: 'PATCH' });
      onProjectChange(saved);
      refreshPointBalance();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '프로젝트 상태를 변경하지 못했습니다.');
    } finally {
      setActiveAction(null);
    }
  };

  const actions = project ? (
    <div className="flex flex-wrap justify-end gap-2">
      {project.status === 'WAITING' && project.requesterId !== userId && (
        <>
          <ActionButton onClick={() => changeStatus('start')} disabled={Boolean(activeAction)} tone="primary"><Check size={12} />수락</ActionButton>
          <ActionButton onClick={() => changeStatus('reject')} disabled={Boolean(activeAction)} tone="danger"><X size={12} />거절</ActionButton>
        </>
      )}
      {project.status === 'WORKING' && (
        <>
          <ActionButton onClick={() => changeStatus('complete')} disabled={Boolean(activeAction)} tone="primary"><Check size={12} />완료</ActionButton>
          <ActionButton onClick={() => changeStatus('cancel')} disabled={Boolean(activeAction)} tone="danger"><X size={12} />취소</ActionButton>
        </>
      )}
      {project.status === 'COMPLETION_PENDING' && project.completionRequestedBy !== userId && (
        <ActionButton onClick={() => changeStatus('complete')} disabled={Boolean(activeAction)} tone="primary"><Check size={12} />완료 확인</ActionButton>
      )}
      {project.status === 'CANCELLATION_PENDING' && project.cancellationRequestedBy !== userId && (
        <ActionButton onClick={() => changeStatus('cancel')} disabled={Boolean(activeAction)} tone="danger"><X size={12} />취소 확인</ActionButton>
      )}
      {project.status === 'WAITING' && project.requesterId === userId && (
        <ActionButton onClick={openEditForm} disabled={Boolean(activeAction)}><Pencil size={12} />수정</ActionButton>
      )}
    </div>
  ) : null;

  return (
    <>
      <div className="shrink-0 border-b border-border bg-surface px-4 py-3">
        {!project ? (
          <div className="flex justify-end">
            <button type="button" onClick={openCreateForm} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20">
              <Briefcase size={14} />프로젝트 시작
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsExpanded((current) => !current)} className="flex min-w-0 flex-1 items-center justify-between rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-left text-sm font-bold text-text-primary hover:border-primary/60">
                <span>{isOpenProject ? '진행 중인 프로젝트' : '종료된 프로젝트'}</span>
                <ChevronDown size={16} className={`text-text-muted transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              </button>
              {!isOpenProject && (
                <button type="button" onClick={openCreateForm} className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20">
                  <Briefcase size={14} />새 프로젝트
                </button>
              )}
            </div>
            {isExpanded && <div className="mt-3"><ProjectMessageCard project={project} pinned actions={actions} /></div>}
          </>
        )}
        {errorMessage && !isFormOpen && <p className="mt-2 text-xs font-bold text-accent">{errorMessage}</p>}
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button type="button" onClick={() => !isSaving && setIsFormOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" aria-label="프로젝트 입력 닫기" />
          <form onSubmit={saveProject} className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-text-primary">{isEditing ? '프로젝트 수정' : '프로젝트 시작'}</h2>
            <p className="mt-1 text-sm text-text-secondary">작업 조건을 입력해주세요.</p>
            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProjectInput label="작업 분야" value={form.field} onChange={(value) => setForm((current) => ({ ...current, field: value }))} placeholder="예: 숏폼 편집" />
              <ProjectInput label="금액" type="number" min="0" value={form.price} onChange={(value) => setForm((current) => ({ ...current, price: value }))} placeholder="예: 150000" />
              <div className="sm:col-span-2">
                <p className="text-sm font-bold text-text-secondary">작업량 기준</p>
                <div className="mt-2 grid grid-cols-2 rounded-xl border border-border bg-surface-elevated p-1">
                  <button type="button" onClick={() => setForm((current) => ({ ...current, workUnit: 'MINUTE' }))} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${form.workUnit === 'MINUTE' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>영상 길이 / 분</button>
                  <button type="button" onClick={() => setForm((current) => ({ ...current, workUnit: 'CASE' }))} className={`rounded-lg px-3 py-2 text-sm font-bold transition-colors ${form.workUnit === 'CASE' ? 'bg-primary text-white' : 'text-text-secondary hover:text-text-primary'}`}>작업 건수 / 건</button>
                </div>
              </div>
              <ProjectInput label={form.workUnit === 'CASE' ? '작업 건수(건)' : '영상 길이(분)'} type="number" min="1" value={form.workAmount} onChange={(value) => setForm((current) => ({ ...current, workAmount: value }))} placeholder={form.workUnit === 'CASE' ? '예: 5' : '예: 10'} />
              <label className="text-sm font-bold text-text-secondary">
                수정 횟수
                <div className="mt-2 flex gap-2">
                  <input required={!form.revisionUnlimited} disabled={form.revisionUnlimited} type="number" min="0" value={form.revisionCount} onChange={(event) => setForm((current) => ({ ...current, revisionCount: event.target.value }))} className="form-input min-w-0 flex-1 disabled:opacity-50" placeholder="예: 2" />
                  <button type="button" onClick={() => setForm((current) => ({ ...current, revisionUnlimited: !current.revisionUnlimited }))} className={`rounded-lg border px-3 text-xs font-bold ${form.revisionUnlimited ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface-elevated text-text-secondary'}`}>무제한</button>
                </div>
              </label>
              <label className="text-sm font-bold text-text-secondary">
                마감 날짜
                <input required type="date" min={minDeadline.slice(0, 10)} value={form.deadlineDate} onChange={(event) => setForm((current) => ({ ...current, deadlineDate: event.target.value }))} className="form-input mt-2" />
              </label>
              <label className="text-sm font-bold text-text-secondary">
                마감 시간
                <input required type="time" value={form.deadlineTime} onChange={(event) => setForm((current) => ({ ...current, deadlineTime: event.target.value }))} className="form-input mt-2" />
              </label>
            </div>
            <label className="mt-4 block text-sm font-bold text-text-secondary">
              메모
              <textarea value={form.memo} onChange={(event) => setForm((current) => ({ ...current, memo: event.target.value }))} rows={4} className="form-input mt-2 resize-none" placeholder="작업 범위, 참고사항 등을 입력하세요." />
            </label>
            {errorMessage && <p className="mt-3 text-xs font-bold text-accent">{errorMessage}</p>}
            <div className="mt-5 flex gap-3">
              <button type="button" disabled={isSaving} onClick={() => setIsFormOpen(false)} className="flex-1 rounded-xl bg-surface-elevated py-2.5 text-sm font-bold text-text-primary disabled:opacity-50">취소</button>
              <button type="submit" disabled={isSaving || !form.field.trim() || !form.price || !form.workAmount || (!form.revisionUnlimited && !form.revisionCount) || !form.deadlineDate || !form.deadlineTime} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white disabled:opacity-50">{isSaving ? '저장 중...' : isEditing ? '수정하기' : '프로젝트 시작'}</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

function ActionButton({ children, onClick, disabled, tone = 'default' }: { children: React.ReactNode; onClick: () => void; disabled: boolean; tone?: 'default' | 'primary' | 'danger' }) {
  const color = tone === 'primary' ? 'border-primary/40 bg-primary/10 text-primary' : tone === 'danger' ? 'border-accent/30 bg-accent/10 text-accent' : 'border-border bg-surface-elevated text-text-secondary';
  return <button type="button" onClick={onClick} disabled={disabled} className={`inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-bold disabled:opacity-50 ${color}`}>{children}</button>;
}

function ProjectInput({ label, value, onChange, type = 'text', min, placeholder }: { label: string; value: string; onChange: (value: string) => void; type?: string; min?: string; placeholder?: string }) {
  return (
    <label className="text-sm font-bold text-text-secondary">
      {label}
      <input required type={type} min={min} value={value} onChange={(event) => onChange(event.target.value)} className="form-input mt-2" placeholder={placeholder} />
    </label>
  );
}
