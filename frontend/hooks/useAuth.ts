'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import {
  clearAuthSession,
  completeOnboarding,
  discardPendingAuthSession,
  getAccessToken,
  isOnboardingPending,
  setUserRole,
} from '@/lib/auth-session';
import {
  announceAccountSuspension,
  isSuspensionResponse,
} from '@/lib/suspension';

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
  window.dispatchEvent(new Event('authSessionCleared'));
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

    const accessToken = getAccessToken();
    if (!accessToken) {
      setIsAuthChecked(true);
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (res.status === 423 && isSuspensionResponse(data)) {
          announceAccountSuspension(data);
          throw new Error('Account suspended');
        }
        if (!res.ok) throw new Error('Unauthorized');
        return data;
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
        setUserRole(data.role);
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
    const handleSessionCleared = () => setUser(null);
    window.addEventListener('authSessionCleared', handleSessionCleared);
    return () => {
      window.removeEventListener('authUserUpdated', handleUserUpdated);
      window.removeEventListener('authSessionCleared', handleSessionCleared);
    };
  }, []);

  return { user, setUser, isAuthChecked };
}
