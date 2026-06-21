export type SuspensionResponse = {
  code: 'ACCOUNT_SUSPENDED';
  message: string;
  reason: string;
  suspendedUntil: string;
  remainingMinutes: number;
};

export function isSuspensionResponse(value: unknown): value is SuspensionResponse {
  if (!value || typeof value !== 'object') return false;
  return (value as { code?: string }).code === 'ACCOUNT_SUSPENDED';
}

export function formatSuspensionMessage(
  reason: string,
  suspendedUntil: string,
  remainingMinutes: number,
) {
  const totalHours = Math.max(1, Math.ceil(remainingMinutes / 60));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  const remaining = days > 0
    ? `${days}일${hours > 0 ? ` ${hours}시간` : ''}`
    : `${totalHours}시간`;
  const until = new Date(suspendedUntil).toLocaleString('ko-KR');

  return `제한 사유: ${reason}\n남은 시간: 약 ${remaining}\n해제 예정: ${until}`;
}

export function announceAccountSuspension(data: SuspensionResponse) {
  window.dispatchEvent(new CustomEvent<SuspensionResponse>('accountSuspended', {
    detail: data,
  }));
}
