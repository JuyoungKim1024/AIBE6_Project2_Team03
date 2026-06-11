'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video, Youtube, Scissors, Users, Check, ArrowRight } from 'lucide-react';

type Role = '유튜버' | '편집자' | '둘다';

const roles: { id: Role; label: string; desc: string; icon: typeof Youtube }[] = [
  { id: '유튜버', label: '유튜버', desc: '내 채널 영상을 편집해줄 에디터를 찾고 있어요', icon: Youtube },
  { id: '편집자', label: '편집자', desc: '편집 실력으로 일감을 찾고 수익을 내고 싶어요', icon: Scissors },
  { id: '둘다', label: '둘 다', desc: '유튜버이면서 편집도 직접 하거나 의뢰해요', icon: Users },
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">Cut<span className="text-primary">Match</span></span>
        </div>
        <div className="flex items-center justify-center gap-2 mb-8">
          {['role', 'profile'].map((s, i) => (
            <Fragment key={s}>
              <div className={`w-2.5 h-2.5 rounded-full transition-colors ${s === 'role' ? 'bg-primary' : 'bg-surface-elevated'}`} />
              {i === 0 && <div className="w-8 h-px bg-border" />}
            </Fragment>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">어떤 목적으로 오셨나요?</h1>
          <p className="text-sm text-text-secondary text-center mb-6">선택에 따라 맞춤 기능을 보여드려요</p>
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
          <button onClick={() => router.push('/onboarding/profile')} disabled={!selectedRole} className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold transition-colors ${selectedRole ? 'bg-primary text-white hover:bg-primary/90' : 'bg-surface-elevated text-text-muted cursor-not-allowed'}`}>
            다음 <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
