'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/mypage?tab=chats');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <p className="text-sm text-text-secondary">채팅 목록으로 이동 중입니다...</p>
    </div>
  );
}
