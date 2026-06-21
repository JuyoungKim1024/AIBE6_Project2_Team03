'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import {
  clearAuthSession,
  completeOnboarding,
  discardPendingAuthSession,
  isOnboardingPending,
} from '@/lib/auth-session';

export type AuthUser = {
  id: string;
  nickname: string;
  profileImage?: string | null;
  role: 'YOUTUBER' | 'EDITOR' | null;
  onboardingRequired: boolean;
  termsAgreed: boolean;
  admin: boolean;
  testAccount: boolean;
};

export function clearTokens() {
  clearAuthSession();
}

export function useAuth() {
  const pathname = usePathname();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    const isOnboardingPath = pathname.startsWith('/onboarding');
    if (isOnboardingPending() && !isOnboardingPath) {
      discardPendingAuthSession();
      setUser(null);
      setIsAuthChecked(true);
      return;
    }

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
        if (data.onboardingRequired && !isOnboardingPath) {
          discardPendingAuthSession();
          setUser(null);
          return;
        }
        if (!data.onboardingRequired) {
          completeOnboarding();
        }
        if (data.role) localStorage.setItem('userRole', data.role);
        setUser(data);
      })
      .catch(() => {
        clearTokens();
        setUser(null);
      })
      .finally(() => setIsAuthChecked(true));
  }, [pathname]);

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
