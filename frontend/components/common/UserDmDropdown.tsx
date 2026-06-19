'use client';

import React, { MouseEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { createDirectChatRequest } from '@/lib/api/chat';
import { DirectChatRequestModal } from '@/components/common/DirectChatRequestModal';

type UserDmDropdownProps = {
  targetUserId: string;
  targetName: string;
  children: ReactNode;
};

export function UserDmDropdown({ targetUserId, targetName, children }: UserDmDropdownProps) {
  const router = useRouter();
  const ref = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    function handleClick(event: MouseEvent | globalThis.MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    if (open) {
      document.addEventListener('mousedown', handleClick);
    }

    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  const toggleOpen = (event: MouseEvent<HTMLSpanElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setErrorMessage('');
    setOpen((current) => !current);
  };

  const openRequestModal = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setErrorMessage('');

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!response.ok) throw new Error('로그인이 필요합니다.');
      const me = await response.json() as { id: string };
      if (me.id === targetUserId) {
        alert('본인에게는 DM을 보낼 수 없습니다.');
        setOpen(false);
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    setShowRequestModal(true);
  };

  const submitDmRequest = async (message: string) => {
    if (isCreating) return;

    setIsCreating(true);
    setErrorMessage('');

    try {
      await createDirectChatRequest(targetUserId, message);
      setOpen(false);
      setShowRequestModal(false);
      setErrorMessage('DM 요청을 보냈습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'DM을 시작하지 못했습니다.';
      if (message.includes('로그인')) {
        router.push('/login');
        return;
      }
      setErrorMessage(message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <span ref={ref} className="relative inline-flex">
      <span
        role="button"
        tabIndex={0}
        onClick={toggleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setOpen((current) => !current);
          }
        }}
        className="inline-flex cursor-pointer items-center"
        aria-label={`${targetName} 메뉴 열기`}
      >
        {children}
      </span>

      {open && (
        <span className="absolute left-0 top-full z-50 mt-2 w-44 rounded-xl border border-border bg-surface p-1.5 shadow-2xl">
          <button
            type="button"
            onClick={openRequestModal}
            disabled={isCreating}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-bold text-text-primary hover:bg-surface-elevated disabled:cursor-not-allowed disabled:opacity-60"
          >
            <MessageCircle size={15} className="text-primary" />
            {isCreating ? '요청 중...' : 'DM 요청하기'}
          </button>
          {errorMessage && <span className="block px-3 pb-2 text-xs text-primary">{errorMessage}</span>}
        </span>
      )}
      {showRequestModal && (
        <DirectChatRequestModal
          targetName={targetName}
          isSubmitting={isCreating}
          onClose={() => setShowRequestModal(false)}
          onSubmit={submitDmRequest}
        />
      )}
    </span>
  );
}
