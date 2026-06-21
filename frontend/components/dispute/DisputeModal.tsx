'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const DISPUTE_TYPES = [
  { value: 'QUALITY', label: '품질 문제', desc: '결과물이 계약 수준에 미달함' },
  { value: 'DEADLINE', label: '납기 지연', desc: '마감일을 초과하거나 지연됨' },
  { value: 'SCOPE', label: '범위 분쟁', desc: '계약 범위 외 작업 요구/거절' },
  { value: 'MISSING', label: '잠수/연락두절', desc: '상대방이 연락을 받지 않음' },
  { value: 'COPYRIGHT', label: '저작권 분쟁', desc: '저작권 귀속 문제' },
] as const;

type DisputeType = typeof DISPUTE_TYPES[number]['value'];

interface Props {
  projectId: string;
  accessToken: string | null;
  onClose: () => void;
  onCreated: (disputeId: string) => void;
}

export function DisputeModal({ projectId, accessToken, onClose, onCreated }: Props) {
  const [selectedType, setSelectedType] = useState<DisputeType | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedType || !description.trim()) {
      setError('분쟁 유형과 상세 내용을 모두 입력해주세요.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify({ projectId, type: selectedType, description: description.trim() }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || '분쟁 신고에 실패했습니다.');
      }

      const data = await res.json();
      if (!data?.id) throw new Error('서버 응답이 올바르지 않습니다.');
      onCreated(data.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '분쟁 신고에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          className="relative bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" />
              <h2 className="font-bold text-text-primary">분쟁 신고</h2>
            </div>
            <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <p className="text-sm font-medium text-text-primary mb-2">분쟁 유형</p>
              <div className="space-y-2">
                {DISPUTE_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setSelectedType(type.value)}
                    className={`w-full text-left p-3 rounded-xl border transition-colors ${
                      selectedType === type.value
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-surface-elevated hover:border-primary/40'
                    }`}
                  >
                    <p className="text-sm font-bold">{type.label}</p>
                    <p className="text-xs text-text-muted mt-0.5">{type.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-sm font-medium text-text-primary mb-2">상세 내용</p>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="분쟁 내용을 구체적으로 설명해주세요. AI가 채팅 이력과 함께 분석합니다."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-surface-elevated p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
              />
              <p className="text-xs text-text-muted mt-1">{description.length}자</p>
            </div>

            {error && <p className="text-xs text-red-500 bg-red-500/10 rounded-lg p-3">{error}</p>}

            <p className="text-xs text-text-muted bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-lg p-3">
              분쟁을 신고하면 AI가 채팅 이력과 계약 내용을 분석하여 조정안을 제시합니다. 양측이 동의하면 포인트가 자동 정산됩니다.
            </p>
          </div>

          <div className="p-4 border-t border-border flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border text-sm text-text-secondary hover:bg-surface-elevated transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !selectedType || !description.trim()}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'AI 분석 요청 중...' : '분쟁 신고'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
