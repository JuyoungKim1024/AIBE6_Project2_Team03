'use client';

import React, { Fragment, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Camera, User, Video } from 'lucide-react';

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const finish = () => router.push('/');

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
              <div className="w-2.5 h-2.5 rounded-full bg-primary transition-colors" />
              {index === 0 && <div className="w-8 h-px bg-border" />}
            </Fragment>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">프로필을 설정해주세요</h1>
          <p className="text-sm text-text-secondary text-center mb-8">나중에 다시 수정할 수 있어요</p>
          <div className="flex flex-col items-center mb-6">
            <button className="relative group" type="button">
              <div className="w-24 h-24 rounded-full bg-surface-elevated border border-border flex items-center justify-center overflow-hidden">
                <User size={36} className="text-text-muted" />
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center border-2 border-surface">
                <Camera size={15} className="text-white" />
              </div>
            </button>
          </div>
          <div className="mb-8">
            <label className="block text-sm font-bold text-text-primary mb-2">닉네임</label>
            <input type="text" value={nickname} onChange={(event) => setNickname(event.target.value)} placeholder="사용할 닉네임을 입력하세요" className="w-full bg-surface-elevated border border-border rounded-xl px-4 py-3 text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
            <p className="text-xs text-text-muted mt-2">입력하지 않으면 소셜 계정 닉네임을 사용합니다.</p>
          </div>
          <div className="flex gap-3">
            <button onClick={finish} className="flex-1 py-3.5 rounded-xl bg-surface-elevated text-text-secondary font-bold hover:text-text-primary transition-colors">건너뛰기</button>
            <button onClick={finish} className="flex-1 py-3.5 rounded-xl bg-primary text-white font-bold hover:bg-primary/90 transition-colors">완료</button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
