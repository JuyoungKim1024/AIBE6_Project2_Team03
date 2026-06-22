'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Circle, KeyRound } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

type Step = 'email' | 'verify' | 'password' | 'complete';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verificationToken, setVerificationToken] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (step !== 'verify' || remainingSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setRemainingSeconds((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [remainingSeconds, step]);

  const requestVerification = async () => {
    if (!email.trim() || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/password-reset/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '인증 메일 발송에 실패했습니다.');
      setCode('');
      setRemainingSeconds(data?.expiresInSeconds ?? 300);
      setStep('verify');
      setMessage('인증번호를 이메일로 전송했습니다.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : '인증 메일 발송에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyEmail = async () => {
    if (code.length !== 6 || remainingSeconds <= 0 || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/password-reset/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '이메일 인증에 실패했습니다.');
      setVerificationToken(data.verificationToken);
      setRemainingSeconds(0);
      setStep('password');
      setMessage('이메일 인증이 완료되었습니다.');
    } catch (verifyError) {
      setError(verifyError instanceof Error ? verifyError.message : '이메일 인증에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!isPasswordValid || password !== passwordConfirm || isSubmitting) return;
    setIsSubmitting(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/local/password-reset/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, verificationToken }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) throw new Error(data?.message ?? '비밀번호 재설정에 실패했습니다.');
      setStep('complete');
      setMessage('비밀번호가 변경되었습니다.');
    } catch (resetError) {
      setError(resetError instanceof Error ? resetError.message : '비밀번호 재설정에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const passwordChecks = [
    { label: '8자 이상', valid: password.length >= 8 },
    { label: '영문 대문자 포함', valid: /[A-Z]/.test(password) },
    { label: '영문 소문자 포함', valid: /[a-z]/.test(password) },
    { label: '숫자 포함', valid: /\d/.test(password) },
  ];
  const isPasswordValid = passwordChecks.every((check) => check.valid);
  const passwordMatched = passwordConfirm.length > 0 && password === passwordConfirm;
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = String(remainingSeconds % 60).padStart(2, '0');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/login" className="mb-8 flex flex-col items-center hover:opacity-80">
          <div className="mb-3 rounded-2xl bg-primary/10 p-3">
            <KeyRound size={32} className="text-primary" />
          </div>
          <span className="text-2xl font-bold text-text-primary">크크<span className="text-primary">킄</span></span>
        </Link>

        <div className="rounded-2xl border border-border bg-surface p-8">
          <h1 className="mb-1 text-center text-xl font-bold text-text-primary">비밀번호 찾기</h1>
          <p className="mb-6 text-center text-sm text-text-secondary">가입한 이메일 인증 후 비밀번호를 변경할 수 있습니다.</p>

          {step === 'email' && (
            <div className="space-y-3">
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="가입한 이메일" className="form-input" autoComplete="email" />
              <button type="button" onClick={requestVerification} disabled={!email.trim() || isSubmitting} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-50">
                {isSubmitting ? '전송 중...' : '이메일 인증'}
              </button>
            </div>
          )}

          {step === 'verify' && (
            <div className="space-y-3">
              <input value={email} disabled className="form-input opacity-60" />
              <div className="relative">
                <input value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="인증번호 6자리" className="form-input pr-16" inputMode="numeric" />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-primary">{minutes}:{seconds}</span>
              </div>
              <button type="button" onClick={verifyEmail} disabled={code.length !== 6 || remainingSeconds <= 0 || isSubmitting} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-50">
                {isSubmitting ? '확인 중...' : '인증번호 확인'}
              </button>
              <button type="button" onClick={requestVerification} disabled={isSubmitting || remainingSeconds > 240} className="w-full text-sm font-bold text-text-secondary disabled:opacity-40">
                인증번호 재전송
              </button>
            </div>
          )}

          {step === 'password' && (
            <form onSubmit={resetPassword} className="space-y-3">
              <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="새 비밀번호" className="form-input" autoComplete="new-password" />
              <input type="password" value={passwordConfirm} onChange={(event) => setPasswordConfirm(event.target.value)} placeholder="새 비밀번호 확인" className="form-input" autoComplete="new-password" />
              <div className="space-y-1.5">
                {passwordChecks.map((check) => (
                  <div key={check.label} className={`flex items-center gap-2 text-xs ${check.valid ? 'text-green-500' : 'text-text-muted'}`}>
                    {check.valid ? <Check size={13} /> : <Circle size={13} />}{check.label}
                  </div>
                ))}
                {passwordConfirm && <p className={`text-xs ${passwordMatched ? 'text-green-500' : 'text-accent'}`}>{passwordMatched ? '비밀번호가 일치합니다.' : '비밀번호가 일치하지 않습니다.'}</p>}
              </div>
              <button type="submit" disabled={!isPasswordValid || !passwordMatched || isSubmitting} className="w-full rounded-xl bg-primary py-3.5 font-bold text-white disabled:opacity-50">
                {isSubmitting ? '변경 중...' : '비밀번호 변경'}
              </button>
            </form>
          )}

          {step === 'complete' && (
            <div className="space-y-5 text-center">
              <p className="font-bold text-text-primary">비밀번호 변경이 완료되었습니다.</p>
              <Link href="/login" className="block w-full rounded-xl bg-primary py-3.5 font-bold text-white">로그인으로 이동</Link>
            </div>
          )}

          {message && <p className="mt-4 text-sm font-bold text-primary">{message}</p>}
          {error && <p className="mt-4 text-sm font-bold text-accent">{error}</p>}
        </div>
      </div>
    </div>
  );
}
