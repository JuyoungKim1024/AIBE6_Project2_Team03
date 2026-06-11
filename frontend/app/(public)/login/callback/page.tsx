'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const onboardingRequired = searchParams.get('onboardingRequired') === 'true';

    if (!accessToken || !refreshToken) {
      router.replace('/login');
      return;
    }

    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    router.replace(onboardingRequired ? '/onboarding/role' : '/');
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-text-secondary">로그인 처리 중입니다...</p>
    </div>
  );
}

export default function LoginCallbackPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center px-4">로그인 처리 중입니다...</div>}>
      <LoginCallbackContent />
    </Suspense>
  );
}
