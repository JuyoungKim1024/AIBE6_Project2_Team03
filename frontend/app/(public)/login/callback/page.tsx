'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api';
import { getAccessToken, restoreAuthSession } from '@/lib/auth-session';

function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const onboardingRequired = searchParams.get('onboardingRequired') === 'true';

    restoreAuthSession()
      .then(async (auth) => {
        if (!auth) {
          router.replace('/login');
          return;
        }
        if (!onboardingRequired) {
          router.replace('/');
          return;
        }

        const token = getAccessToken();
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = response.ok ? await response.json() : null;
        if (!user?.termsAgreed) {
          router.replace('/onboarding/terms');
          return;
        }
        router.replace(user.role ? '/onboarding/profile' : '/onboarding/role');
      })
      .catch(() => router.replace('/login'));
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-text-secondary">로그인 처리 중입니다.</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-4">로그인 처리 중입니다.</div>}>
      <LoginCallbackContent />
    </Suspense>
  );
}
