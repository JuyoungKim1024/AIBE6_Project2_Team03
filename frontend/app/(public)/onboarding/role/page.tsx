'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Scissors, Video, Youtube } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';
import { useModal } from '@/store/modalStore';
import { getAccessToken } from '@/lib/auth-session';

type Role = 'YOUTUBER' | 'EDITOR';

type RoleGuide = {
  id: Role;
  label: string;
  desc: string;
  icon: typeof Youtube;
  features: string[];
};

const roles: RoleGuide[] = [
  {
    id: 'YOUTUBER',
    label: '크리에이터',
    desc: '내 채널 영상 작업을 맡길 에디터를 찾고 싶어요.',
    icon: Youtube,
    features: [
      '구인글을 작성해 에디터를 모집할 수 있어요.',
      '에디터 공개 프로필과 포트폴리오를 확인할 수 있어요.',
      '맞춤매칭으로 조건에 맞는 에디터를 추천받을 수 있어요.',
      'DM과 프로젝트 관리로 작업 진행 상태를 확인할 수 있어요.',
    ],
  },
  {
    id: 'EDITOR',
    label: '에디터',
    desc: '편집 실력으로 의뢰를 찾고 포트폴리오를 보여주고 싶어요.',
    icon: Scissors,
    features: [
      '구직글을 작성해 작업 가능 상태를 알릴 수 있어요.',
      '에디터 프로필, 분야/툴 태그, 포트폴리오를 공개할 수 있어요.',
      '맞춤매칭 단가를 설정하고 매칭 요청을 받을 수 있어요.',
      '전투력, 리뷰, 최근 거래내역으로 신뢰도를 쌓을 수 있어요.',
    ],
  },
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const { openModal } = useModal();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitRole = async () => {
    if (isSubmitting) {
      return;
    }

    if (!selectedRole) {
      openModal({ title: '역할 선택', message: '크리에이터 또는 에디터 중 하나를 선택해주세요.' });
      return;
    }

    const accessToken = getAccessToken();
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
      openModal({ title: '저장 실패', message: '역할 저장에 실패했습니다. 다시 로그인해주세요.' });
      router.push('/login');
      return;
    }

    router.push('/onboarding/profile');
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">
            크크<span className="text-primary">킄</span>
          </span>
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
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">크크킄에서 사용할 역할을 선택해주세요</h1>
          <p className="text-sm text-text-secondary text-center mb-6">선택한 역할에 맞춰 사용할 수 있는 기능이 달라집니다.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {roles.map((role) => {
              const active = selectedRole === role.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRole(role.id)}
                  className={`w-full p-5 rounded-xl border text-left transition-all ${active ? 'border-primary bg-primary/10' : 'border-border bg-surface-elevated hover:border-text-muted'}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-primary text-white' : 'bg-surface text-text-secondary'}`}>
                      <role.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-text-primary">{role.label}</div>
                      <div className="text-xs text-text-secondary leading-snug mt-1">{role.desc}</div>
                    </div>
                    {active && <Check size={20} className="text-primary flex-shrink-0 mt-1" />}
                  </div>

                  <div className="mt-5 space-y-2">
                    {role.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2 text-xs text-text-secondary leading-relaxed">
                        <Check size={13} className={active ? 'text-primary mt-0.5 flex-shrink-0' : 'text-text-muted mt-0.5 flex-shrink-0'} />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
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
