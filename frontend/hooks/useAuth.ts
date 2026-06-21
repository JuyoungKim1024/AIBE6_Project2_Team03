'use client';

import { useEffect, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';

export type AuthUser = {
  id: string;
  nickname: string;
  profileImage?: string | null;
  role: 'YOUTUBER' | 'EDITOR' | null;
  onboardingRequired: boolean;
  termsAgreed: boolean;
};

export function clearTokens() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
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
      .then((data: AuthUser) => {
        if (data.role) localStorage.setItem('userRole', data.role);
        setUser(data);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsAuthChecked(true));
  }, []);

  useEffect(() => {
    const handleUserUpdated = (event: Event) => {
      const updatedUser = (event as CustomEvent<Partial<AuthUser>>).detail;
      if (!updatedUser) {
        return;
      }
      setUser((current) => current ? { ...current, ...updatedUser } : current);
    };

    window.addEventListener('authUserUpdated', handleUserUpdated);
    return () => window.removeEventListener('authUserUpdated', handleUserUpdated);
  }, []);

  return { user, setUser, isAuthChecked };
}
