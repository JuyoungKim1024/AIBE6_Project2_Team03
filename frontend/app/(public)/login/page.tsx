'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Video } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();

  const handleSocial = () => router.push('/onboarding/role');

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary/10 p-3 rounded-2xl mb-3">
            <Video size={32} className="text-primary" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-text-primary">Cut<span className="text-primary">Match</span></span>
        </div>
        <motion.div key="login" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-border rounded-2xl p-8">
          <h1 className="text-xl font-bold text-text-primary text-center mb-1">시작하기</h1>
          <p className="text-sm text-text-secondary text-center mb-8">소셜 계정으로 간편하게 로그인하세요</p>
          <div className="space-y-3">
            <button onClick={handleSocial} className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
              </svg>
              Google로 계속하기
            </button>
            <button onClick={handleSocial} className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191600] font-bold py-3.5 rounded-xl hover:bg-[#FADA0A] transition-colors">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#191600">
                <path d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.86 5.18 4.66 6.56-.2.72-.74 2.68-.84 3.1-.13.52.19.52.4.38.16-.11 2.6-1.76 3.66-2.48.7.1 1.42.16 2.12.16 5.52 0 10-3.48 10-7.72S17.52 3 12 3z" />
              </svg>
              카카오로 계속하기
            </button>
          </div>
          <p className="text-xs text-text-muted text-center mt-6 leading-relaxed">
            로그인 시 <span className="text-text-secondary underline">이용약관</span> 및 <span className="text-text-secondary underline">개인정보 처리방침</span>에<br />동의하는 것으로 간주됩니다.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
