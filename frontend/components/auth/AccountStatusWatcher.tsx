'use client';

import { getAccessToken } from '@/lib/auth-session';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { clearTokens } from '@/hooks/useAuth';
import { useModal } from '@/store/modalStore';
import {
  announceAccountSuspension,
  formatSuspensionMessage,
  isSuspensionResponse,
  type SuspensionResponse,
} from '@/lib/suspension';

const STATUS_CHECK_INTERVAL_MS = 5_000;

export function AccountStatusWatcher() {
  const router = useRouter();
  const { openModal } = useModal();
  const suspensionHandled = useRef(false);

  useEffect(() => {
    const handleSuspension = (event: Event) => {
      if (suspensionHandled.current) return;
      const data = (event as CustomEvent<SuspensionResponse>).detail;
      if (!isSuspensionResponse(data)) return;

      suspensionHandled.current = true;
      clearTokens();
      openModal({
        title: '계정이 임시 제한되었습니다',
        message: formatSuspensionMessage(
          data.reason,
          data.suspendedUntil,
          data.remainingMinutes,
        ),
        confirmLabel: '확인',
      });
      router.replace('/login');
    };

    const checkAccountStatus = async () => {
      const accessToken = getAccessToken();
      if (!accessToken || suspensionHandled.current) return;

      try {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        const data = await response.json().catch(() => null);

        if (response.status !== 423 || !isSuspensionResponse(data)) return;

        announceAccountSuspension(data);
      } catch {
        // Temporary network errors must not log the user out.
      }
    };

    window.addEventListener('accountSuspended', handleSuspension);
    void checkAccountStatus();
    const intervalId = window.setInterval(checkAccountStatus, STATUS_CHECK_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('accountSuspended', handleSuspension);
    };
  }, [openModal, router]);

  return null;
}
