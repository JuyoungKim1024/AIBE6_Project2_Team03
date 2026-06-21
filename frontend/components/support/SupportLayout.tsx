'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const links = [
  { label: '공지사항', href: '/notices' },
  { label: '자주 묻는 질문', href: '/faq' },
  { label: '문의하기', href: '/contact' },
  { label: '신고센터', href: '/report' },
];

export function SupportLayout({ title, description, currentPath, children }: {
  title: string;
  description: string;
  currentPath: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthChecked } = useAuth();

  useEffect(() => {
    if (isAuthChecked && !user) {
      router.replace('/login');
    }
  }, [isAuthChecked, router, user]);

  if (!isAuthChecked || !user) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">로그인 상태를 확인하는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <p className="text-sm font-bold text-primary mb-2">고객지원</p>
          <h1 className="text-3xl font-bold text-text-primary">{title}</h1>
          <p className="text-sm text-text-secondary mt-3">{description}</p>
        </header>
        <nav className="flex gap-2 overflow-x-auto border-b border-border mb-8">
          {links.map((item) => (
            <Link key={item.href} href={item.href} className={`shrink-0 px-3 py-3 text-sm font-bold border-b-2 ${currentPath === item.href ? 'border-primary text-primary' : 'border-transparent text-text-secondary hover:text-text-primary'}`}>
              {item.label}
            </Link>
          ))}
        </nav>
        {children}
      </div>
    </div>
  );
}
