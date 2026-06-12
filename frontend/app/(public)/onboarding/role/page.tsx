'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Scissors, Video, Youtube } from 'lucide-react';

type Role = 'YOUTUBER' | 'EDITOR';

const roles: { id: Role; label: string; desc: string; icon: typeof Youtube }[] = [
  { id: 'YOUTUBER', label: '유튜버', desc: '내 채널 영상 작업을 맡길 에디터를 찾고 있어요', icon: Youtube },
  { id: 'EDITOR', label: '에디터', desc: '편집 실력으로 의뢰를 찾고 수익을 만들고 싶어요', icon: Scissors },
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8080';

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRole = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedRole) {
      alert('유튜버 또는 에디터 중 하나를 선택해야 로그인할 수 있습니다.');
      return;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    const response = await fetch(`${API_BASE_URL}/api/users/me/role`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ role: selectedRole }),
    });

    setIsSubmitting(false);
    if (!response.ok) {
      alert('역할 저장에 실패했습니다. 다시 로그인해주세요.');
      router.push('/login');
      return;
    }

    router.push(selectedRole === 'EDITOR' ? '/onboarding/editor-profile' : '/onboarding/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">크크<span className="text-primary">킄</span></span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {['role', 'profile'].map((step, index) => (
            <Fragment key={step}>
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${step === 'role' ? 'bg-primary' : 'bg-surface-elevated'}`} />
              {index === 0 && <div className="w-8 h-px bg-border" />}
            </Fragment>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">역할을 선택해주세요</h1>
          <p className="text-sm text-text-secondary text-center mb-6">유튜버 또는 에디터 중 하나를 선택해야 이용할 수 있어요</p>
          <div className="space-y-3 mb-6">
            {roles.map((role) => {
              const active = selectedRole === role.id;
              return (
                <button key={role.id} onClick={() => setSelectedRole(role.id)} className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${active ? 'border-primary bg-primary/10' : 'border-border bg-surface-elevated hover:border-text-muted'}`}>
                  <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}>
                    <role.icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-text-primary">{role.label}</div>
                    <div className="text-xs text-text-secondary leading-snug">{role.desc}</div>
                  </div>
                  {active && <Check size={20} className="text-primary flex-shrink-0" />}
                </button>
              );
            })}
          </div>
          <button onClick={submitRole} disabled={isSubmitting} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-colors ${!isSubmitting ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-elevated text-text-muted cursor-not-allowed'}`}>
            다음 <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
