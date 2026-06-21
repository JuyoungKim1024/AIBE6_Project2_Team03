'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, User, Video } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

async function readErrorMessage(response: Response) {
  try {
    const data = await response.json();
    return data.message ?? '프로필 저장에 실패했습니다.';
  } catch {
    return '프로필 저장에 실패했습니다.';
  }
}

function formatPhoneNumber(value: string) {
  const numbers = value.replace(/\D/g, '').slice(0, 11);

  if (numbers.length <= 3) {
    return numbers;
  }
  if (numbers.length <= 7) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  }
  return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
}

function readImageAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [nickname, setNickname] = useState('');
  const [profileImage, setProfileImage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const changeProfileImage = async (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('이미지 파일만 등록할 수 있습니다.');
      return;
    }

    try {
      setProfileImage(await readImageAsDataUrl(file));
      setError('');
    } catch {
      setError('이미지를 불러오지 못했습니다.');
    }
  };

  const submitProfile = async () => {
    if (isSubmitting) {
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setError('');
    setIsSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name, phone, nickname, profileImage }),
    });
    setIsSubmitting(false);

    if (!response.ok) {
      setError(await readErrorMessage(response));
      return;
    }

    const user = await response.json();
    router.push(user.role === 'EDITOR' ? '/onboarding/editor-profile' : '/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">컷매치</span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {['role', 'profile'].map((step, index) => (
            <Fragment key={step}>
              <div className="w-2.5 h-2.5 rounded-full bg-primary transition-colors" />
              {index === 0 && <div className="w-8 h-px bg-border" />}
            </Fragment>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">프로필을 설정해주세요</h1>
          <p className="text-sm text-text-secondary text-center mb-8">닉네임은 비워두면 자동으로 생성됩니다.</p>
          <div className="flex flex-col items-center mb-6">
            <label className="relative group cursor-pointer">
              <div className="w-24 h-24 rounded-full bg-surface-elevated border border-border flex items-center justify-center overflow-hidden">
                {profileImage ? (
                  <img src={profileImage} alt="프로필 이미지 미리보기" className="w-full h-full object-cover" />
                ) : (
                  <User size={36} className="text-text-muted" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-surface">
                <Camera size={15} className="text-white" />
              </div>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => changeProfileImage(event.target.files?.[0])}
              />
            </label>
          </div>
          <div className="space-y-5 mb-8">
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">이름</label>
              <input type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="이름을 입력해주세요" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">전화번호</label>
              <input type="tel" value={phone} onChange={(event) => setPhone(formatPhoneNumber(event.target.value))} placeholder="010-1234-5678" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-bold text-text-primary mb-2">닉네임</label>
              <input type="text" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="사용할 닉네임을 입력하세요" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
              <p className="text-xs text-text-muted mt-2">미입력 시 랜덤 닉네임이 자동 설정됩니다.</p>
            </div>
            {error && <p className="text-sm font-bold text-accent">{error}</p>}
          </div>
          <button onClick={submitProfile} disabled={isSubmitting} className={`w-full py-3.5 rounded-xl font-bold transition-colors ${isSubmitting ? 'bg-surface-elevated text-text-muted cursor-not-allowed' : 'bg-primary text-white hover:bg-primary/90'}`}>
            완료
          </button>
        </motion.div>
      </div>
    </div>
  );
}
