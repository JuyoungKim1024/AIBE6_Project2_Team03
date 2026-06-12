'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export type AuthUser = {
  id: string;
  nickname: string;
  role: 'YOUTUBER' | 'EDITOR' | null;
  onboardingRequired: boolean;
};

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      setIsAuthChecked(true);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error('Unauthorized');
        return res.json();
      })
      .then((data: AuthUser) => setUser(data))
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsAuthChecked(true));
  }, []);

  return { user, setUser, isAuthChecked };
}
