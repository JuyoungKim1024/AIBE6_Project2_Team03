'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, XCircle, Scale, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface AiJudgment {
  summary: string;
  editorFaultReasons: string[];
  requesterFaultReasons: string[];
  adjustedAmount: number;
  adjustmentReason: string;
  recommendation: string;
}

interface DisputeData {
  id: string;
  status: 'AI_PENDING' | 'AI_JUDGED' | 'ACCEPTED' | 'ESCALATED';
  aiJudgment: string | null;
  finalAmount: number | null;
  requesterAccepted: boolean | null;
  editorAccepted: boolean | null;
}

interface Props {
  disputeId: string;
  accessToken: string | null;
  onClose: () => void;
}

function parseJudgment(raw: string | null): AiJudgment | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw.replace(/```json\n?|\n?```/g, '').trim()) as AiJudgment;
  } catch {
    return null;
  }
}

export function DisputeResultModal({ disputeId, accessToken, onClose }: Props) {
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [judgment, setJudgment] = useState<AiJudgment | null>(null);
  const [isResponding, setIsResponding] = useState(false);
  const [responseError, setResponseError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchDispute = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      });
      if (!res.ok) {
        if (res.status === 401 && pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        return;
      }
      const data: DisputeData = await res.json();
      setDispute(data);

      if (data.status !== 'AI_PENDING') {
        if (pollingRef.current) clearInterval(pollingRef.current);
      }

      setJudgment(parseJudgment(data.aiJudgment));
    } catch (err) {
      console.error('분쟁 상태 조회 실패:', err);
    }
  }, [disputeId, accessToken]);

  useEffect(() => {
    fetchDispute();
    pollingRef.current = setInterval(fetchDispute, 2000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchDispute]);

  const respond = async (accepted: boolean) => {
    if (isResponding) return;
    setIsResponding(true);
    setResponseError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}/respond`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ accepted }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '응답 처리에 실패했습니다.');
      }
      const data: DisputeData = await res.json();
      setDispute(data);
      setJudgment(parseJudgment(data.aiJudgment));
    } catch (err) {
      setResponseError(err instanceof Error ? err.message : '응답 처리에 실패했습니다.');
    } finally {
      setIsResponding(false);
    }
  };

  const isPending = !dispute || dispute.status === 'AI_PENDING';
  const isJudged = dispute?.status === 'AI_JUDGED';
  const isAccepted = dispute?.status === 'ACCEPTED';
  const isEscalated = dispute?.status === 'ESCALATED';

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[200] flex items-center justify-center px-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          className="relative bg-surface border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <Scale size={18} className="text-primary" />
              <h2 className="font-bold text-text-primary">AI 분쟁 조정</h2>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
            {isPending && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <Loader2 size={36} className="animate-spin text-primary" />
                <div className="text-center">
                  <p className="font-bold text-text-primary">AI가 분쟁을 분석 중입니다</p>
                  <p className="text-sm text-text-muted mt-1">채팅 이력과 계약 조건을 검토하고 있습니다</p>
                </div>
              </div>
            )}

            {(isJudged || isAccepted || isEscalated) && judgment && (
              <>
                <div className="rounded-xl border border-border bg-surface-elevated p-4">
                  <p className="text-xs font-bold text-primary mb-1">분쟁 요약</p>
                  <p className="text-sm text-text-primary leading-relaxed">{judgment.summary}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border bg-surface-elevated p-3">
                    <p className="text-xs font-bold text-amber-500 mb-2">에디터 귀책 사유</p>
                    {judgment.editorFaultReasons.length === 0 ? (
                      <p className="text-xs text-text-muted">없음</p>
                    ) : (
                      <ul className="space-y-1">
                        {judgment.editorFaultReasons.map((r, i) => (
                          <li key={i} className="text-xs text-text-secondary flex gap-1">
                            <span className="text-amber-500 flex-shrink-0">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <div className="rounded-xl border border-border bg-surface-elevated p-3">
                    <p className="text-xs font-bold text-blue-500 mb-2">크리에이터 귀책 사유</p>
                    {judgment.requesterFaultReasons.length === 0 ? (
                      <p className="text-xs text-text-muted">없음</p>
                    ) : (
                      <ul className="space-y-1">
                        {judgment.requesterFaultReasons.map((r, i) => (
                          <li key={i} className="text-xs text-text-secondary flex gap-1">
                            <span className="text-blue-500 flex-shrink-0">•</span> {r}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs font-bold text-primary">AI 조정 금액</p>
                    <p className="text-lg font-bold text-text-primary">
                      ₩{judgment.adjustedAmount.toLocaleString('ko-KR')}
                    </p>
                  </div>
                  <p className="text-xs text-text-muted">{judgment.adjustmentReason}</p>
                </div>

                <div className="rounded-xl border border-border bg-surface-elevated p-3">
                  <p className="text-xs font-bold text-text-secondary mb-1">권고 메시지</p>
                  <p className="text-xs text-text-primary leading-relaxed">{judgment.recommendation}</p>
                </div>
              </>
            )}

            {isEscalated && !judgment && (
              <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
                <Scale size={32} className="text-text-muted opacity-40" />
                <p className="font-bold text-text-primary">운영자 검토 이관</p>
                <p className="text-sm text-text-muted">AI 판정에 실패하거나 양측이 합의하지 않아 운영자가 검토합니다.</p>
              </div>
            )}

            {isAccepted && (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  양측이 조정안에 동의했습니다. 포인트 정산이 완료됩니다.
                </p>
              </div>
            )}

            {isEscalated && (dispute?.requesterAccepted === false || dispute?.editorAccepted === false) && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
                <XCircle size={16} className="text-amber-500 flex-shrink-0" />
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">
                  한쪽이 조정안에 불복하여 운영자 검토로 이관되었습니다.
                </p>
              </div>
            )}

            {responseError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded-lg p-3">{responseError}</p>
            )}
          </div>

          <div className="p-4 border-t border-border">
            {isJudged && (
              <div className="space-y-2">
                <p className="text-xs text-text-muted text-center mb-3">AI 조정안에 동의하시겠습니까?</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => respond(false)}
                    disabled={isResponding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-medium text-text-secondary hover:bg-surface-elevated transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <XCircle size={16} />
                    불복 (운영자 이관)
                  </button>
                  <button
                    onClick={() => respond(true)}
                    disabled={isResponding}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <CheckCircle size={16} />
                    {isResponding ? '처리 중...' : '동의 (정산 진행)'}
                  </button>
                </div>
              </div>
            )}
            {(isAccepted || isEscalated) && (
              <button
                onClick={onClose}
                className="w-full py-2.5 rounded-xl border border-border text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                닫기
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
