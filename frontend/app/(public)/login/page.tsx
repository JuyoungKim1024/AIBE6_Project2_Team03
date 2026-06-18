'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  onboardingRequired: boolean;
  user: { role: 'YOUTUBER' | 'EDITOR' | null };
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSocial = (provider: 'google' | 'kakao') => {
    window.location.href = `${API_BASE_URL}/api/auth/${provider}/login`;
  };

  const handleLocalLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(data?.message ?? '로그인에 실패했습니다.');
      }

      const auth = data as AuthResponse;
      localStorage.setItem('accessToken', auth.accessToken);
      router.replace(auth.onboardingRequired ? (auth.user.role ? '/onboarding/profile' : '/onboarding/role') : '/');
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl text-text-primary">크크<span className="text-primary">킄</span></span>
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">로그인</h1>
          <p className="text-sm text-text-secondary text-center mb-6">이메일 또는 소셜 계정으로 로그인하세요.</p>

          <form onSubmit={handleLocalLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="이메일"
              autoComplete="email"
              required
              className="form-input"
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="비밀번호"
              autoComplete="current-password"
              required
              className="form-input"
            />
            {error && <p className="text-sm font-bold text-accent">{error}</p>}
            <button type="submit" disabled={isSubmitting} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50">
              {isSubmitting ? '로그인 중...' : '이메일 로그인'}
            </button>
          </form>

          <Link href="/signup" className="block text-center text-sm font-bold text-primary mt-4 hover:underline">
            이메일로 회원가입
          </Link>

          <div className="flex items-center gap-3 my-6">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">또는</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <div className="space-y-3">
            <button type="button" onClick={() => handleSocial('google')} className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-100">
              Google로 계속하기
            </button>
            <button type="button" onClick={() => handleSocial('kakao')} className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191600] font-bold py-3.5 rounded-xl hover:bg-[#FADA0A]">
              카카오로 계속하기
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
