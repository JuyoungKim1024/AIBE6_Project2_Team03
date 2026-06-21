'use client';

export const PROJECT_MESSAGE_PREFIX = '__PROJECT_CARD__';

export type ProjectMessagePayload = {
  id: string;
  roomId: string;
  requesterId?: string;
  editorId?: string;
  completionRequestedBy?: string | null;
  field: string | null;
  price: number | null;
  workAmount?: number | null;
  workUnit?: 'MINUTE' | 'CASE';
  /** 이전 채팅 카드 데이터 호환용 */
  videoLength?: number | null;
  revisionCount?: number;
  deadline: string | null;
  memo: string | null;
  status: string;
};

function formatWorkAmount(project: ProjectMessagePayload) {
  const amount = project.workAmount ?? project.videoLength;
  if (!amount) return '미정';
  return project.workUnit === 'CASE' ? `${amount}건` : `${amount}분`;
}

export function serializeProjectMessage(project: ProjectMessagePayload) {
  return `${PROJECT_MESSAGE_PREFIX}${JSON.stringify(project)}`;
}

export function parseProjectMessage(content: string): ProjectMessagePayload | null {
  if (!content.startsWith(PROJECT_MESSAGE_PREFIX)) return null;

  try {
    return JSON.parse(content.slice(PROJECT_MESSAGE_PREFIX.length)) as ProjectMessagePayload;
  } catch {
    return null;
  }
}

function formatPrice(price: number | null) {
  return price ? `₩${price.toLocaleString('ko-KR')}` : '금액 미정';
}

function formatDeadline(deadline: string | null) {
  if (!deadline) return '마감일 미정';
  return new Date(deadline).toLocaleString('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getProjectStatusLabel(status: string) {
  if (status === 'WAITING') return '수락 대기';
  if (status === 'WORKING') return '진행 중';
  if (status === 'COMPLETION_PENDING') return '완료 대기';
  if (status === 'COMPLETED') return '완료된 프로젝트입니다';
  if (status === 'REJECTED') return '거절된 프로젝트입니다';
  if (status === 'CANCELED') return '취소된 프로젝트입니다';
  return status;
}

function getProjectTone(status: string) {
  if (status === 'COMPLETED' || status === 'REJECTED' || status === 'CANCELED') {
    return {
      card: 'border-border bg-surface-elevated',
      badge: 'bg-surface text-text-secondary',
      label: 'text-text-secondary',
    };
  }
  return {
    card: 'border-primary/40 bg-primary/5',
    badge: 'bg-primary/10 text-primary',
    label: 'text-primary',
  };
}

export function ProjectMessageCard({
  project,
  pinned = false,
  actions,
}: {
  project: ProjectMessagePayload;
  pinned?: boolean;
  actions?: React.ReactNode;
}) {
  const tone = getProjectTone(project.status);

  if (pinned) {
    return (
      <div className={`w-full rounded-xl border px-4 py-3 text-left ${tone.card}`}>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <span className={`text-xs font-bold ${tone.label}`}>프로젝트</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}>
                {getProjectStatusLabel(project.status)}
              </span>
            </div>
            <h4 className="truncate text-sm font-bold text-text-primary">
              {project.field || '프로젝트'}
            </h4>
            {project.memo && (
              <p className="mt-1 line-clamp-1 text-xs text-text-muted">
                {project.memo}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-3 lg:items-end">
            <div className="grid w-full grid-cols-3 gap-2 text-xs lg:w-72">
              <div>
                <p className="text-text-muted">금액</p>
                <p className="font-bold text-text-primary">{formatPrice(project.price)}</p>
              </div>
              <div>
                <p className="text-text-muted">작업량</p>
                <p className="font-bold text-text-primary">{formatWorkAmount(project)}</p>
              </div>
              <div>
                <p className="text-text-muted">마감</p>
                <p className="font-bold text-text-primary">{formatDeadline(project.deadline)}</p>
              </div>
            </div>
            {actions ? <div className="flex w-full justify-end lg:w-auto">{actions}</div> : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-sm rounded-xl border bg-surface p-3 text-left shadow-[0_0_14px_rgba(59,130,246,0.12)] ${project.status === 'COMPLETED' ? 'border-border shadow-none' : 'border-primary/40'}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className={`text-xs font-bold ${tone.label}`}>프로젝트</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${tone.badge}`}>
          {getProjectStatusLabel(project.status)}
        </span>
      </div>
      <h4 className="text-sm font-bold text-text-primary">
        {project.field || '프로젝트'}
      </h4>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-surface-elevated p-2">
          <p className="text-text-muted">금액</p>
          <p className="mt-0.5 font-bold text-text-primary">{formatPrice(project.price)}</p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-2">
          <p className="text-text-muted">작업량</p>
          <p className="mt-0.5 font-bold text-text-primary">{formatWorkAmount(project)}</p>
        </div>
      </div>
      <p className="mt-2 text-xs text-text-secondary">{formatDeadline(project.deadline)}</p>
      {project.memo && (
        <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap break-words text-xs text-text-muted">
          {project.memo}
        </p>
      )}
      {actions ? <div className="mt-2 flex justify-end">{actions}</div> : null}
    </div>
  );
}
