'use client';

export const PROJECT_MESSAGE_PREFIX = '__PROJECT_CARD__';

export type ProjectMessagePayload = {
  id: string;
  roomId: string;
  field: string | null;
  price: number | null;
  videoLength: number | null;
  deadline: string | null;
  memo: string | null;
  status: string;
};

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

export function ProjectMessageCard({ project }: { project: ProjectMessagePayload }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-primary/40 bg-surface p-4 text-left shadow-[0_0_20px_rgba(59,130,246,0.15)]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-primary">프로젝트 시작</span>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {project.status}
        </span>
      </div>
      <h4 className="text-sm font-bold text-text-primary">
        {project.field || '프로젝트'}
      </h4>
      <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-surface-elevated p-2">
          <p className="text-text-muted">금액</p>
          <p className="mt-0.5 font-bold text-text-primary">{formatPrice(project.price)}</p>
        </div>
        <div className="rounded-lg bg-surface-elevated p-2">
          <p className="text-text-muted">영상 길이</p>
          <p className="mt-0.5 font-bold text-text-primary">
            {project.videoLength ? `${project.videoLength}분` : '미정'}
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs text-text-secondary">{formatDeadline(project.deadline)}</p>
      {project.memo && (
        <p className="mt-2 whitespace-pre-wrap break-words text-xs text-text-muted">
          {project.memo}
        </p>
      )}
    </div>
  );
}
