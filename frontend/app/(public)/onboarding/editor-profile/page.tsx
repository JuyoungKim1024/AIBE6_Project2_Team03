'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, FolderOpen, Video } from 'lucide-react';

export default function OnboardingEditorProfilePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">크크<span className="text-primary">킄</span></span>
        </div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">에디터 프로필을 등록할까요?</h1>
          <p className="text-sm text-text-secondary text-center mb-8">분야, 툴, 포트폴리오를 등록하면 공개 프로필과 매칭에 활용됩니다.</p>
          <div className="space-y-3">
            <button onClick={() => router.push('/mypage?tab=editor-profile')} className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-primary bg-primary/10 text-left transition-colors">
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-primary text-white flex items-center justify-center">
                  <FolderOpen size={19} />
                </span>
                <span>
                  <span className="block font-bold text-text-primary">지금 등록</span>
                  <span className="block text-xs text-text-secondary mt-0.5">에디터 프로필 등록 화면으로 이동</span>
                </span>
              </span>
              <ArrowRight size={18} className="text-primary" />
            </button>
            <button onClick={() => router.push('/')} className="w-full flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-surface-elevated text-left hover:border-text-muted transition-colors">
              <span className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-lg bg-surface text-text-secondary flex items-center justify-center">
                  <Clock size={19} />
                </span>
                <span>
                  <span className="block font-bold text-text-primary">나중에 등록</span>
                  <span className="block text-xs text-text-secondary mt-0.5">마이페이지에서 언제든 등록 가능</span>
                </span>
              </span>
              <ArrowRight size={18} className="text-text-muted" />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
