'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MailCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { TermsAgreement } from '@/components/auth/TermsAgreement';

export default function OnboardingTermsPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const agreeToTerms = async () => {
    if (isSubmitting) return;
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.replace('/login');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/me/terms`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const user = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(user?.message ?? '약관 동의 처리에 실패했습니다.');
      }
      router.replace(user?.role ? '/onboarding/profile' : '/onboarding/role');
    } catch (agreementError) {
      setError(agreementError instanceof Error ? agreementError.message : '약관 동의 처리에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <MailCheck size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl text-text-primary">
            크크<span className="text-primary">킄</span>
          </span>
        </div>
        <div className="bg-surface border border-border rounded-2xl p-8">
          <TermsAgreement onContinue={agreeToTerms} isSubmitting={isSubmitting} />
          {error && <p className="text-sm font-bold text-accent mt-4">{error}</p>}
        </div>
      </div>
    </div>
  );
}
