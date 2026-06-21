'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, Scale, Loader2, MessageCircle } from 'lucide-react';
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
  status: 'AI_PENDING' | 'AI_JUDGED' | 'AI_FAILED' | 'ACCEPTED';
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
    return JSON.parse(raw.trim()) as AiJudgment;
  } catch {
    return null;
  }
}

export function DisputeResultModal({ disputeId, accessToken, onClose }: Props) {
  const [dispute, setDispute] = useState<DisputeData | null>(null);
  const [judgment, setJudgment] = useState<AiJudgment | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const accessTokenRef = useRef(accessToken);
  accessTokenRef.current = accessToken;

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const fetchDispute = useCallback(async () => {
    try {
      const token = accessTokenRef.current;
      const res = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        if (res.status === 401) stopPolling();
        return;
      }
      const data: DisputeData = await res.json();
      setDispute(data);
      setJudgment(parseJudgment(data.aiJudgment));

      if (data.status === 'ACCEPTED' || data.status === 'AI_FAILED') stopPolling();
    } catch (err) {
      console.error('분쟁 상태 조회 실패:', err);
    }
  }, [disputeId, stopPolling]);

  useEffect(() => {
    fetchDispute();
    pollingRef.current = setInterval(fetchDispute, 5000);
    return stopPolling;
  }, [fetchDispute, stopPolling]);

  const acceptJudgment = async () => {
    if (isAccepting) return;
    setIsAccepting(true);
    setAcceptError('');
    try {
      const token = accessTokenRef.current;
      const res = await fetch(`${API_BASE_URL}/api/disputes/${disputeId}/respond`, {
        method: 'PATCH',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || '응답 처리에 실패했습니다.');
      }
      const data: DisputeData = await res.json();
      setDispute(data);
      setJudgment(parseJudgment(data.aiJudgment));
      if (data.status === 'ACCEPTED') stopPolling();
    } catch (err) {
      setAcceptError(err instanceof Error ? err.message : '응답 처리에 실패했습니다.');
    } finally {
      setIsAccepting(false);
    }
  };

  const isPending = !dispute || dispute.status === 'AI_PENDING';
  const isJudged = dispute?.status === 'AI_JUDGED';
  const isFailed = dispute?.status === 'AI_FAILED';
  const isAccepted = dispute?.status === 'ACCEPTED';

  const acceptedCount = [dispute?.requesterAccepted, dispute?.editorAccepted].filter((v) => v === true).length;

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

            {isFailed && (
              <div className="flex flex-col items-center justify-center py-10 gap-3 text-center">
                <Scale size={32} className="text-text-muted opacity-40" />
                <p className="font-bold text-text-primary">AI 판정에 실패했습니다</p>
                <p className="text-sm text-text-muted leading-relaxed">
                  채팅에서 상대방과 직접 협의하여 해결해 주세요.
                </p>
              </div>
            )}

            {isJudged && !judgment && (
              <div className="flex flex-col items-center justify-center py-6 gap-3 text-center">
                <Scale size={28} className="text-text-muted opacity-40" />
                <p className="text-sm font-bold text-text-primary">AI 판정 결과를 표시할 수 없습니다</p>
                <p className="text-xs text-text-muted">채팅에서 상대방과 직접 협의해 주세요.</p>
              </div>
            )}

            {(isJudged || isAccepted) && judgment && (
              <>
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <p className="text-xs font-bold text-primary mb-1">AI 의견 (참고용)</p>
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

                <div className="rounded-xl border border-border bg-surface-elevated p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-xs font-bold text-text-secondary">AI 권장 정산 금액</p>
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

            {isJudged && (
              <div className="flex items-start gap-2 rounded-xl border border-border bg-surface-elevated p-3">
                <MessageCircle size={15} className="text-text-muted flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-muted leading-relaxed">
                  동의하지 않으시면 이 창을 닫고 채팅에서 상대방과 직접 협의하세요. 합의가 되면 채팅방 상단 <span className="font-medium text-amber-600">AI 분쟁 조정</span> 버튼을 눌러 다시 동의할 수 있습니다.
                </p>
              </div>
            )}

            {isJudged && acceptedCount > 0 && (
              <div className="flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3">
                <CheckCircle size={15} className="text-primary flex-shrink-0" />
                <p className="text-xs text-primary font-medium">
                  {acceptedCount}명이 동의했습니다. 상대방도 동의하면 정산이 자동으로 진행됩니다.
                </p>
              </div>
            )}

            {isAccepted && (
              <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/10 p-3">
                <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  양측이 동의했습니다. AI 권장 금액으로 정산이 완료됩니다.
                </p>
              </div>
            )}

            {acceptError && (
              <p className="text-xs text-red-500 bg-red-500/10 rounded-lg p-3">{acceptError}</p>
            )}
          </div>

          <div className="p-4 border-t border-border">
            {isJudged && (
              <button
                onClick={acceptJudgment}
                disabled={isAccepting}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircle size={16} />
                {isAccepting ? '처리 중...' : 'AI 조정안에 동의 (정산 진행)'}
              </button>
            )}
            {(isAccepted || isFailed) && (
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
