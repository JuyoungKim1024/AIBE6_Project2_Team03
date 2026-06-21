'use client';

import React, { FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type DirectChatRequestModalProps = {
  targetName: string;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void> | void;
  title?: string;
  initialMessage?: string;
};

export function DirectChatRequestModal({
  targetName,
  isSubmitting,
  onClose,
  onSubmit,
  title = 'DM 요청하기',
  initialMessage = '안녕하세요. DM 문의드립니다.',
}: DirectChatRequestModalProps) {
  const [message, setMessage] = useState(initialMessage);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isSubmitting) return;
    await onSubmit(trimmedMessage);
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onClose();
        }}
        disabled={isSubmitting}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm disabled:cursor-not-allowed"
        aria-label="DM 요청 닫기"
      />
      <form
        onSubmit={submit}
        onClick={(event) => event.stopPropagation()}
        className="relative w-full max-w-md rounded-2xl border border-border bg-surface p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-text-primary">{title}</h3>
        <p className="mt-2 text-sm text-text-secondary">
          {targetName}님에게 보낼 첫 메시지를 입력하세요.
        </p>
        <textarea
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          rows={5}
          className="mt-4 w-full resize-none rounded-xl border border-border bg-surface-elevated p-3 text-sm text-text-primary placeholder:text-text-muted focus:border-primary focus:outline-none"
          placeholder="첫 메시지를 입력하세요."
        />
        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            disabled={isSubmitting}
            className="flex-1 rounded-xl bg-surface-elevated py-2.5 text-sm font-bold text-text-primary transition-colors hover:bg-border disabled:cursor-not-allowed disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? '요청 중...' : '요청 보내기'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
