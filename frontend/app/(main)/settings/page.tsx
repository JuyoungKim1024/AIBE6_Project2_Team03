'use client';

import React, { useState } from 'react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';
const DELETE_CONFIRMATION = '탈퇴하겠습니다';

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.message ?? '회원탈퇴에 실패했습니다.';
  } catch {
    return '회원탈퇴에 실패했습니다.';
  }
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);
  if (numbers.length <= 3) return numbers;
  if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

export default function SettingsPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileMessage, setProfileMessage] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSubmitting, setIsProfileSubmitting] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const canDelete = confirmation === DELETE_CONFIRMATION && !isSubmitting;
  const canSaveProfile = nickname.trim().length > 0 && !isProfileSubmitting;

  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return;
    }

    fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (!data) {
          return;
        }
        setName(data.name ?? '');
        setPhone(data.phone ?? '');
        setNickname(data.nickname ?? '');
      });
  }, []);

  const saveProfile = async () => {
    if (!canSaveProfile) {
      return;
    }
    if (nickname.trim().length < 2) {
      setProfileError('닉네임은 2글자 이상 입력해주세요');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setProfileMessage('');
    setProfileError('');
    setIsProfileSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, phone, nickname }),
    });
    setIsProfileSubmitting(false);

    if (!response.ok) {
      setProfileError(await readErrorMessage(response));
      return;
    }
    setProfileMessage('사용자 정보가 저장되었습니다.');
  };

  const deleteAccount = async () => {
    if (!canDelete) {
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ confirmation }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      setError(await readErrorMessage(response));
      return;
    }

    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-text-primary mb-8">설정</h1>
        <section className="bg-surface border border-border rounded-xl p-6 mb-6">
          <h2 className="text-lg font-bold text-text-primary mb-1">사용자 정보변경</h2>
          <p className="text-sm text-text-secondary mb-6">이름, 전화번호, 닉네임을 변경합니다.</p>
          <div className="space-y-5">
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-2">이름</span>
              <input value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해주세요" className="form-input" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-2">전화번호</span>
              <input value={phone} onChange={(event) => setPhone(formatPhoneNumber(event.target.value))} placeholder="010-1234-5678" className="form-input" />
            </label>
            <label className="block">
              <span className="block text-sm font-bold text-text-primary mb-2">닉네임</span>
              <input value={nickname} onChange={(event) => { setNickname(event.target.value); setProfileError(''); }} placeholder="닉네임을 입력해주세요" className="form-input" />
            </label>
            {profileError && <p className="text-sm font-bold text-accent">{profileError}</p>}
            {profileMessage && <p className="text-sm font-bold text-primary">{profileMessage}</p>}
            <button onClick={saveProfile} disabled={!canSaveProfile} className={`px-4 py-3 rounded-xl text-sm font-bold transition-colors ${canSaveProfile ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-elevated text-text-muted cursor-not-allowed'}`}>
              저장
            </button>
          </div>
        </section>
        <section className="bg-surface border border-border rounded-xl p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-accent/10 text-accent flex items-center justify-center flex-shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary">회원탈퇴</h2>
              <p className="text-sm text-text-secondary mt-1">탈퇴하면 계정과 연결된 데이터가 삭제됩니다.</p>
            </div>
          </div>
          <label className="block text-sm font-bold text-text-primary mb-2">
            확인 문구
          </label>
          <input
            type="text"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            placeholder={DELETE_CONFIRMATION}
            className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent transition-colors"
          />
          <p className="text-xs text-text-muted mt-2">회원탈퇴를 진행하려면 '{DELETE_CONFIRMATION}'를 입력해주세요.</p>
          {error && <p className="text-sm font-bold text-accent mt-4">{error}</p>}
          <button
            type="button"
            onClick={deleteAccount}
            disabled={!canDelete}
            className={`mt-6 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-colors ${canDelete ? 'bg-accent text-white hover:bg-accent/90' : 'bg-surface-elevated text-text-muted cursor-not-allowed'}`}
          >
            <Trash2 size={16} />
            회원탈퇴
          </button>
        </section>
      </div>
    </div>
  );
}
