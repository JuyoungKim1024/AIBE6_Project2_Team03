'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Bell, Flag, Inbox, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminNoticesPanel, AdminTicketsPanel } from '@/components/admin/AdminSupportPanels';

const sections = {
  dashboard: {
    title: '관리자 대시보드',
    description: '크크킄 운영 현황과 관리 기능을 확인합니다.',
    icon: LayoutDashboard,
  },
  notices: {
    title: '공지사항 관리',
    description: '서비스 공지사항을 작성하고 노출 상태를 관리합니다.',
    icon: Bell,
  },
  inquiries: {
    title: '문의 관리',
    description: '사용자 문의 접수와 처리 상태를 관리합니다.',
    icon: Inbox,
  },
  reports: {
    title: '신고 관리',
    description: '사용자·게시글·댓글 신고를 검토하고 처리합니다.',
    icon: Flag,
  },
} as const;

export default function AdminPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAuthChecked } = useAuth();
  const requestedTab = searchParams.get('tab');
  const tab = requestedTab && requestedTab in sections ? requestedTab as keyof typeof sections : 'dashboard';
  const section = sections[tab];

  useEffect(() => {
    if (!isAuthChecked) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!user.admin) {
      router.replace('/');
    }
  }, [isAuthChecked, router, user]);

  if (!isAuthChecked || !user?.admin) {
    return <div className="min-h-screen flex items-center justify-center text-text-muted">관리자 권한을 확인하는 중입니다...</div>;
  }

  return (
    <div className="min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <section.icon size={24} />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-text-primary">{section.title}</h1>
            <p className="text-sm text-text-secondary mt-1">{section.description}</p>
          </div>
        </div>

        {tab === 'dashboard' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { label: '공지사항', value: '작성 및 관리', icon: Bell, href: '/admin?tab=notices' },
              { label: '문의', value: '접수 내역 관리', icon: Inbox, href: '/admin?tab=inquiries' },
              { label: '신고', value: '신고 검토 및 처리', icon: Flag, href: '/admin?tab=reports' },
            ].map((item) => (
              <Link key={item.label} href={item.href} className="bg-surface border border-border rounded-xl p-6 hover:border-primary/50 transition-colors">
                <item.icon size={20} className="text-primary mb-4" />
                <div className="text-sm text-text-muted">{item.label}</div>
                <div className="font-bold text-text-primary mt-1">{item.value}</div>
              </Link>
            ))}
          </div>
        ) : tab === 'notices' ? <AdminNoticesPanel />
          : tab === 'inquiries' ? <AdminTicketsPanel type="INQUIRY" />
            : <AdminTicketsPanel type="REPORT" />}
      </div>
    </div>
  );
}
