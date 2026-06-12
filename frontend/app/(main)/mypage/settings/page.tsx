'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LegacyMypageSettingsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/settings');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center text-text-muted">
      설정 페이지로 이동 중...
    </div>
  );
}
