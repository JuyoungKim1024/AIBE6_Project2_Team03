'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, MailCheck } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type AuthResponse = {
  accessToken: string;
};

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [verificationRequested, setVerificationRequested] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!verificationRequested || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((value) => Math.max(value - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [verificationRequested, remainingSeconds]);

  const requestVerification = async () => {
    if (!email.trim() || isSubmitting) return;

    setError('');
    setMessage('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/signup/request`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '인증 메일 발송에 실패했습니다.');

      setVerificationRequested(true);
      setEmailVerified(false);
      setVerificationToken('');
      setCode('');
      setRemainingSeconds(300);
      setMessage('인증번호를 이메일로 전송했습니다.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '인증 메일 발송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    if (code.length !== 6 || remainingSeconds <= 0 || isSubmitting) return;

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/signup/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '이메일 인증에 실패했습니다.');

      setVerificationToken(data.verificationToken);
      setEmailVerified(true);
      setVerificationRequested(false);
      setRemainingSeconds(0);
      setCode('');
      setMessage('이메일 인증이 완료되었습니다.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : '이메일 인증에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSignup = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    if (!emailVerified || !verificationToken) {
      setError('이메일 인증을 완료해주세요.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/signup/complete`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, verificationToken }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '회원가입에 실패했습니다.');

      const auth = data as AuthResponse;
      localStorage.setItem('accessToken', auth.accessToken);
      router.replace('/onboarding/role');
    } catch (signupError) {
      setError(signupError instanceof Error ? signupError.message : '회원가입에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <MailCheck size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl text-text-primary">크크<span className="text-primary">킄</span></span>
        </div>

        <div className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">이메일 회원가입</h1>
          <p className="text-sm text-text-secondary text-center mb-6">이메일 인증 후 비밀번호를 설정해주세요.</p>

          <form onSubmit={completeSignup} className="space-y-3">
            <div className="grid grid-cols-[minmax(0,1fr)_112px] gap-2">
              <input
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailVerified(false);
                  setVerificationRequested(false);
                  setVerificationToken('');
                  setMessage('');
                }}
                placeholder="이메일"
                autoComplete="email"
                disabled={emailVerified}
                className="form-input min-w-0 disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed"
              />
              <button
                type="button"
                onClick={requestVerification}
                disabled={isSubmitting || !email.trim() || emailVerified}
                className={`min-h-12 rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed ${
                  emailVerified
                    ? 'bg-surface-elevated border border-border text-primary'
                    : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
                }`}
              >
                {emailVerified ? (
                  <span className="flex items-center justify-center gap-1.5"><Check size={15} />인증 완료</span>
                ) : isSubmitting ? '전송 중...' : '이메일 인증'}
              </button>
            </div>

            {verificationRequested && (
              <div className="rounded-xl border border-border bg-surface-elevated p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-text-primary">인증번호 입력</span>
                  <span className={`text-sm font-bold ${remainingSeconds > 0 ? 'text-primary' : 'text-accent'}`}>
                    {minutes}:{seconds}
                  </span>
                </div>
                <div className="grid grid-cols-[minmax(0,1fr)_88px] gap-2">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={code}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, ''))}
                    placeholder="6자리 인증번호"
                    className="form-input text-center tracking-[0.2em] min-w-0"
                  />
                  <button
                    type="button"
                    onClick={verifyEmail}
                    disabled={isSubmitting || code.length !== 6 || remainingSeconds <= 0}
                    className="rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 disabled:opacity-50"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-3">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="비밀번호 (대/소문자, 숫자 포함 8자 이상)"
                autoComplete="new-password"
                disabled={!emailVerified}
                required
                className="form-input disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
              />
              <input
                type="password"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                placeholder="비밀번호 확인"
                autoComplete="new-password"
                disabled={!emailVerified}
                required
                className="form-input disabled:bg-surface-elevated disabled:text-text-muted disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button type="submit" disabled={isSubmitting || !emailVerified} className="w-full py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed">
                {isSubmitting ? '가입 중...' : '회원가입'}
              </button>
            </div>
          </form>

          {message && !emailVerified && <p className="text-sm font-bold text-primary mt-4">{message}</p>}
          {emailVerified && <p className="text-sm font-bold text-primary mt-4">이메일 인증이 완료되었습니다.</p>}
          {error && <p className="text-sm font-bold text-accent mt-4">{error}</p>}

          <Link href="/login" className="block text-center text-sm text-text-secondary mt-6 hover:text-text-primary">
            이미 계정이 있나요? 로그인
          </Link>
        </div>
      </div>
    </div>
  );
}
