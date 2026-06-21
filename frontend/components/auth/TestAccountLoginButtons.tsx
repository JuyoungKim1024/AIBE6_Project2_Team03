'use client';

import { Scissors, Youtube } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

const TEST_ACCOUNT_LOGIN_ENABLED = true;

type TestRole = 'YOUTUBER' | 'EDITOR';
type AuthResponse = { accessToken: string; refreshToken: string };

export function TestAccountLoginButtons({
  disabled,
  onStart,
  onError,
}: {
  disabled: boolean;
  onStart: () => void;
  onError: (message: string) => void;
}) {
  if (!TEST_ACCOUNT_LOGIN_ENABLED) return null;

  const login = async (role: TestRole) => {
    if (disabled) return;
    onStart();
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/test-login/${role}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '테스트 계정 로그인에 실패했습니다.');
      const auth = data as AuthResponse;
      localStorage.setItem('accessToken', auth.accessToken);
      localStorage.setItem('refreshToken', auth.refreshToken);
      window.location.href = '/';
    } catch (error) {
      onError(error instanceof Error ? error.message : '테스트 계정 로그인에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-2">
      <button type="button" onClick={() => login('YOUTUBER')} disabled={disabled} className="w-full flex items-center justify-center gap-2 border border-accent/40 bg-accent/10 text-accent font-bold py-3 rounded-xl hover:bg-accent/15 disabled:opacity-50">
        <Youtube size={17} />크리에이터 테스트 계정 로그인
      </button>
      <button type="button" onClick={() => login('EDITOR')} disabled={disabled} className="w-full flex items-center justify-center gap-2 border border-primary/40 bg-primary/10 text-primary font-bold py-3 rounded-xl hover:bg-primary/15 disabled:opacity-50">
        <Scissors size={17} />에디터 테스트 계정 로그인
      </button>
    </div>
  );
}
